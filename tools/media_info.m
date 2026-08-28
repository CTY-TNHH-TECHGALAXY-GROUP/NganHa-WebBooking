#import <AVFoundation/AVFoundation.h>
#import <Foundation/Foundation.h>

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        if (argc < 2) {
            fprintf(stderr, "Usage: media_info <media>...\n");
            return 2;
        }

        for (int i = 1; i < argc; i++) {
            NSString *path = [NSString stringWithUTF8String:argv[i]];
            NSURL *url = [NSURL fileURLWithPath:path];
            AVURLAsset *asset = [AVURLAsset URLAssetWithURL:url options:nil];
            Float64 duration = CMTimeGetSeconds(asset.duration);
            AVAssetTrack *video = [[asset tracksWithMediaType:AVMediaTypeVideo] firstObject];
            AVAssetTrack *audio = [[asset tracksWithMediaType:AVMediaTypeAudio] firstObject];

            printf("%s\n", [[path lastPathComponent] UTF8String]);
            printf("  duration: %.3fs\n", duration);
            if (video) {
                CGSize natural = video.naturalSize;
                CGAffineTransform t = video.preferredTransform;
                printf("  video: %.0fx%.0f fps %.3f\n", natural.width, natural.height, video.nominalFrameRate);
                printf("  transform: %.3f %.3f %.3f %.3f %.3f %.3f\n", t.a, t.b, t.c, t.d, t.tx, t.ty);
            } else {
                printf("  video: none\n");
            }
            if (audio) {
                printf("  audio: yes\n");
            } else {
                printf("  audio: none\n");
            }
        }
    }
    return 0;
}
