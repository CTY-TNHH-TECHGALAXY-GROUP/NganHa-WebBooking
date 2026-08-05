#import <AVFoundation/AVFoundation.h>
#import <CoreGraphics/CoreGraphics.h>
#import <CoreMedia/CoreMedia.h>
#import <CoreVideo/CoreVideo.h>
#import <Foundation/Foundation.h>
#import <ImageIO/ImageIO.h>

static const int W = 1920;
static const int H = 1080;
static const int FPS = 30;
static const double TOTAL = 11.2;
static const double XFADE = 0.25;

typedef struct {
    int kind;      // 0 video, 1 still
    int source;
    double start;
    double duration;
    double sourceStart;
    double rate;
    double zoom0;
    double zoom1;
    double ox0;
    double oy0;
    double ox1;
    double oy1;
} Shot;

static double clamp01(double v) {
    return fmax(0.0, fmin(1.0, v));
}

static double smoothstep(double v) {
    v = clamp01(v);
    return v * v * (3.0 - 2.0 * v);
}

static CGImageRef loadImage(NSString *path) {
    NSURL *url = [NSURL fileURLWithPath:path];
    CGImageSourceRef source = CGImageSourceCreateWithURL((__bridge CFURLRef)url, NULL);
    if (!source) return NULL;
    CGImageRef image = CGImageSourceCreateImageAtIndex(source, 0, NULL);
    CFRelease(source);
    return image;
}

static void drawFill(CGContextRef ctx, CGImageRef image, double alpha, double zoom, double ox, double oy) {
    size_t iw = CGImageGetWidth(image);
    size_t ih = CGImageGetHeight(image);
    double scale = fmax((double)W / (double)iw, (double)H / (double)ih) * zoom;
    double dw = (double)iw * scale;
    double dh = (double)ih * scale;
    double x = ((double)W - dw) * 0.5 + ox * W;
    double y = ((double)H - dh) * 0.5 + oy * H;

    CGContextSaveGState(ctx);
    CGContextSetAlpha(ctx, alpha);
    CGContextTranslateCTM(ctx, 0, H);
    CGContextScaleCTM(ctx, 1, -1);
    CGContextDrawImage(ctx, CGRectMake(x, y, dw, dh), image);
    CGContextRestoreGState(ctx);
}

static void applyGrade(CGContextRef ctx) {
    CGRect rect = CGRectMake(0, 0, W, H);
    CGContextSaveGState(ctx);
    CGContextSetBlendMode(ctx, kCGBlendModeSoftLight);
    CGContextSetRGBFillColor(ctx, 0.95, 0.73, 0.45, 0.22);
    CGContextFillRect(ctx, rect);
    CGContextSetBlendMode(ctx, kCGBlendModeScreen);
    CGContextSetRGBFillColor(ctx, 1.0, 0.88, 0.68, 0.055);
    CGContextFillRect(ctx, rect);
    CGContextSetBlendMode(ctx, kCGBlendModeMultiply);
    CGContextSetRGBFillColor(ctx, 0.92, 0.84, 0.72, 0.09);
    CGContextFillRect(ctx, rect);
    CGContextRestoreGState(ctx);

    CGFloat locs[3] = {0.0, 0.62, 1.0};
    CGFloat comps[16] = {
        0.0, 0.0, 0.0, 0.00,
        0.0, 0.0, 0.0, 0.02,
        0.0, 0.0, 0.0, 0.20,
    };
    CGColorSpaceRef cs = CGColorSpaceCreateDeviceRGB();
    CGGradientRef grad = CGGradientCreateWithColorComponents(cs, comps, locs, 3);
    CGFloat outer = hypot((CGFloat)W, (CGFloat)H) * 0.65;
    CGContextDrawRadialGradient(ctx, grad, CGPointMake(W * 0.50, H * 0.48), W * 0.08,
                                CGPointMake(W * 0.50, H * 0.48), outer, 0);
    CGGradientRelease(grad);
    CGColorSpaceRelease(cs);
}

static BOOL waitForInput(AVAssetWriterInput *input) {
    while (!input.readyForMoreMediaData) {
        [NSThread sleepForTimeInterval:0.01];
    }
    return YES;
}

static BOOL renderVideo(NSString *videoPath, NSArray<AVAssetImageGenerator *> *generators, CGImageRef still) {
    NSURL *url = [NSURL fileURLWithPath:videoPath];
    [[NSFileManager defaultManager] removeItemAtURL:url error:nil];

    NSError *error = nil;
    AVAssetWriter *writer = [AVAssetWriter assetWriterWithURL:url fileType:AVFileTypeMPEG4 error:&error];
    if (!writer) {
        NSLog(@"writer error: %@", error);
        return NO;
    }

    NSDictionary *settings = @{
        AVVideoCodecKey: AVVideoCodecTypeH264,
        AVVideoWidthKey: @(W),
        AVVideoHeightKey: @(H),
        AVVideoCompressionPropertiesKey: @{
            AVVideoAverageBitRateKey: @(9000000),
            AVVideoExpectedSourceFrameRateKey: @(FPS),
            AVVideoMaxKeyFrameIntervalKey: @(FPS * 2),
            AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel
        }
    };
    AVAssetWriterInput *input = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo outputSettings:settings];
    input.expectsMediaDataInRealTime = NO;

    NSDictionary *attrs = @{
        (NSString *)kCVPixelBufferPixelFormatTypeKey: @(kCVPixelFormatType_32ARGB),
        (NSString *)kCVPixelBufferWidthKey: @(W),
        (NSString *)kCVPixelBufferHeightKey: @(H),
        (NSString *)kCVPixelBufferCGImageCompatibilityKey: @YES,
        (NSString *)kCVPixelBufferCGBitmapContextCompatibilityKey: @YES
    };
    AVAssetWriterInputPixelBufferAdaptor *adaptor =
        [AVAssetWriterInputPixelBufferAdaptor assetWriterInputPixelBufferAdaptorWithAssetWriterInput:input
                                                                         sourcePixelBufferAttributes:attrs];
    if (![writer canAddInput:input]) {
        NSLog(@"writer cannot add video input");
        return NO;
    }
    [writer addInput:input];
    if (![writer startWriting]) {
        NSLog(@"start writing error: %@", writer.error);
        return NO;
    }
    [writer startSessionAtSourceTime:kCMTimeZero];

    Shot shots[] = {
        {0, 0, 0.00, 2.30, 0.35, 0.86, 1.02, 1.055, 0.00, 0.00, 0.00, -0.01},
        {0, 1, 2.05, 2.35, 0.20, 0.86, 1.02, 1.045, 0.00, 0.00, 0.00, 0.00},
        {0, 2, 4.15, 2.45, 0.45, 0.86, 1.015, 1.04, 0.00, 0.00, 0.00, 0.00},
        {1, 0, 6.35, 2.35, 0.00, 1.00, 1.02, 1.09, 0.00, -0.045, 0.00, -0.015},
        {1, 0, 8.45, 2.75, 0.00, 1.00, 1.09, 1.15, 0.00, -0.015, 0.00, 0.005}
    };
    int shotCount = 5;
    int frameCount = (int)llround(TOTAL * FPS);
    CGColorSpaceRef cs = CGColorSpaceCreateDeviceRGB();

    for (int frame = 0; frame < frameCount; frame++) {
        @autoreleasepool {
            waitForInput(input);
            CVPixelBufferRef px = NULL;
            if (!adaptor.pixelBufferPool) {
                NSLog(@"pixel buffer pool is nil");
                CGColorSpaceRelease(cs);
                return NO;
            }
            CVReturn cv = CVPixelBufferPoolCreatePixelBuffer(NULL, adaptor.pixelBufferPool, &px);
            if (cv != kCVReturnSuccess || !px) {
                NSLog(@"pixel buffer error %d", cv);
                CGColorSpaceRelease(cs);
                return NO;
            }
            CVPixelBufferLockBaseAddress(px, 0);
            void *base = CVPixelBufferGetBaseAddress(px);
            size_t stride = CVPixelBufferGetBytesPerRow(px);
            CGContextRef ctx = CGBitmapContextCreate(base, W, H, 8, stride, cs,
                                                     kCGBitmapByteOrder32Big | kCGImageAlphaPremultipliedFirst);
            CGContextSetRGBFillColor(ctx, 0.73, 0.60, 0.44, 1.0);
            CGContextFillRect(ctx, CGRectMake(0, 0, W, H));

            double t = (double)frame / (double)FPS;
            for (int i = 0; i < shotCount; i++) {
                Shot s = shots[i];
                if (t < s.start || t > s.start + s.duration) continue;
                double local = t - s.start;
                double p = smoothstep(local / s.duration);
                double alpha = 1.0;
                if (s.start > 0.0 && local < XFADE) {
                    alpha = smoothstep(local / XFADE);
                }
                double zoom = s.zoom0 + (s.zoom1 - s.zoom0) * p;
                double ox = s.ox0 + (s.ox1 - s.ox0) * p;
                double oy = s.oy0 + (s.oy1 - s.oy0) * p;

                CGImageRef img = NULL;
                if (s.kind == 0) {
                    AVAssetImageGenerator *gen = generators[s.source];
                    CMTime tm = CMTimeMakeWithSeconds(s.sourceStart + local * s.rate, 600);
                    NSError *err = nil;
                    img = [gen copyCGImageAtTime:tm actualTime:NULL error:&err];
                    if (!img) NSLog(@"frame source error shot %d at %.3f: %@", i, t, err);
                } else {
                    img = CGImageRetain(still);
                }
                if (img) {
                    drawFill(ctx, img, alpha, zoom, ox, oy);
                    CGImageRelease(img);
                }
            }

            applyGrade(ctx);
            CGContextRelease(ctx);
            CMTime pts = CMTimeMake(frame, FPS);
            if (![adaptor appendPixelBuffer:px withPresentationTime:pts]) {
                NSLog(@"append failed at frame %d: %@", frame, writer.error);
                CVPixelBufferUnlockBaseAddress(px, 0);
                CVPixelBufferRelease(px);
                CGColorSpaceRelease(cs);
                return NO;
            }
            CVPixelBufferUnlockBaseAddress(px, 0);
            CVPixelBufferRelease(px);
            if (frame % 30 == 0) {
                printf("rendered %.1fs / %.1fs\n", (double)frame / FPS, TOTAL);
                fflush(stdout);
            }
        }
    }

    CGColorSpaceRelease(cs);
    [input markAsFinished];
    dispatch_semaphore_t sema = dispatch_semaphore_create(0);
    [writer finishWritingWithCompletionHandler:^{
        dispatch_semaphore_signal(sema);
    }];
    dispatch_semaphore_wait(sema, DISPATCH_TIME_FOREVER);
    if (writer.status != AVAssetWriterStatusCompleted) {
        NSLog(@"finish error: %@", writer.error);
        return NO;
    }
    return YES;
}

static BOOL mux(NSString *videoPath, NSString *audioPath, NSString *outPath) {
    NSURL *videoURL = [NSURL fileURLWithPath:videoPath];
    NSURL *audioURL = [NSURL fileURLWithPath:audioPath];
    NSURL *outURL = [NSURL fileURLWithPath:outPath];
    [[NSFileManager defaultManager] removeItemAtURL:outURL error:nil];

    AVURLAsset *videoAsset = [AVURLAsset URLAssetWithURL:videoURL options:nil];
    AVURLAsset *audioAsset = [AVURLAsset URLAssetWithURL:audioURL options:nil];
    AVMutableComposition *comp = [AVMutableComposition composition];
    CMTimeRange range = CMTimeRangeMake(kCMTimeZero, CMTimeMakeWithSeconds(TOTAL, 600));

    AVAssetTrack *vtrack = [[videoAsset tracksWithMediaType:AVMediaTypeVideo] firstObject];
    AVMutableCompositionTrack *cv = [comp addMutableTrackWithMediaType:AVMediaTypeVideo preferredTrackID:kCMPersistentTrackID_Invalid];
    NSError *err = nil;
    if (![cv insertTimeRange:range ofTrack:vtrack atTime:kCMTimeZero error:&err]) {
        NSLog(@"video insert error: %@", err);
        return NO;
    }

    AVAssetTrack *atrack = [[audioAsset tracksWithMediaType:AVMediaTypeAudio] firstObject];
    if (atrack) {
        AVMutableCompositionTrack *ca = [comp addMutableTrackWithMediaType:AVMediaTypeAudio preferredTrackID:kCMPersistentTrackID_Invalid];
        [ca insertTimeRange:range ofTrack:atrack atTime:kCMTimeZero error:&err];
    }

    AVAssetExportSession *exporter = [[AVAssetExportSession alloc] initWithAsset:comp presetName:AVAssetExportPresetHighestQuality];
    exporter.outputURL = outURL;
    exporter.outputFileType = AVFileTypeMPEG4;
    exporter.shouldOptimizeForNetworkUse = YES;
    dispatch_semaphore_t sema = dispatch_semaphore_create(0);
    [exporter exportAsynchronouslyWithCompletionHandler:^{
        dispatch_semaphore_signal(sema);
    }];
    while (dispatch_semaphore_wait(sema, dispatch_time(DISPATCH_TIME_NOW, 250000000)) != 0) {
        printf("mux progress %.0f%%\n", exporter.progress * 100.0);
        fflush(stdout);
    }
    if (exporter.status != AVAssetExportSessionStatusCompleted) {
        NSLog(@"export error: %@ status %ld", exporter.error, (long)exporter.status);
        return NO;
    }
    return YES;
}

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        if (argc != 7) {
            fprintf(stderr, "Usage: render_spa_commercial <1487.mov> <1492.mov> <1493.mov> <foot.png> <audio.wav> <output.mp4>\n");
            return 2;
        }

        NSMutableArray *gens = [NSMutableArray array];
        for (int i = 1; i <= 3; i++) {
            NSString *path = [NSString stringWithUTF8String:argv[i]];
            AVURLAsset *asset = [AVURLAsset URLAssetWithURL:[NSURL fileURLWithPath:path] options:nil];
            AVAssetImageGenerator *gen = [AVAssetImageGenerator assetImageGeneratorWithAsset:asset];
            gen.appliesPreferredTrackTransform = YES;
            gen.requestedTimeToleranceBefore = CMTimeMake(1, 60);
            gen.requestedTimeToleranceAfter = CMTimeMake(1, 60);
            gen.maximumSize = CGSizeMake(W * 1.08, H * 1.08);
            [gens addObject:gen];
        }

        NSString *stillPath = [NSString stringWithUTF8String:argv[4]];
        CGImageRef still = loadImage(stillPath);
        if (!still) {
            fprintf(stderr, "Could not load still image.\n");
            return 1;
        }

        NSString *audioPath = [NSString stringWithUTF8String:argv[5]];
        NSString *outPath = [NSString stringWithUTF8String:argv[6]];
        NSString *tempVideo = @"output/spa_commercial_video_only.mp4";

        BOOL ok = renderVideo(tempVideo, gens, still);
        CGImageRelease(still);
        if (!ok) return 1;
        if (!mux(tempVideo, audioPath, outPath)) return 1;
        printf("wrote %s\n", [outPath UTF8String]);
    }
    return 0;
}
