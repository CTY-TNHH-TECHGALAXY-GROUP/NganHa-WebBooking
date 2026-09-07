import crypto from 'crypto';

export class UploadValidationError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string = 'UPLOAD_VALIDATION_ERROR', status: number = 400) {
    super(message);
    this.name = 'UploadValidationError';
    this.code = code;
    this.status = status;
  }
}

export type UploadKind = 'image' | 'video';

export interface ValidatedFileType {
  kind: UploadKind;
  mimeType: string;
  extension: string;
}

export interface ValidateUploadOptions {
  allowedKinds?: UploadKind[];
  maxSizeBytes?: number;
  folder?: string;
  fileName?: string;
  originalFileName?: string;
  declaredMimeType?: string;
}

export interface ValidatedUploadResult {
  buffer: Buffer;
  size: number;
  kind: UploadKind;
  mimeType: string;
  extension: string;
  safeFileName: string;
  safeFolder: string;
  storagePath: string;
}

export const DEFAULT_MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const DEFAULT_MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

const DANGEROUS_EXTENSIONS = new Set([
  'svg', 'html', 'htm', 'xhtml', 'xml', 'js', 'mjs', 'cjs', 'ts', 'jsx', 'tsx',
  'php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'phps',
  'sh', 'bash', 'zsh', 'bat', 'cmd', 'ps1', 'psm1',
  'exe', 'dll', 'com', 'scr', 'vbs', 'vbe', 'wsf', 'wsh', 'msi', 'jar',
  'py', 'pyc', 'pyo', 'rb', 'pl', 'cgi',
  'htaccess', 'htpasswd', 'env', 'ini', 'config', 'jsp', 'asp', 'aspx', 'cfm'
]);

/**
 * Inspects leading magic bytes to identify genuine JPEG, PNG, WEBP, MP4, and QuickTime MOV.
 * Prevents MIME spoofing and extension rename attacks.
 */
function detectFileTypeFromMagicBytes(buffer: Buffer): ValidatedFileType | null {
  if (buffer.length < 12) return null;

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { kind: 'image', mimeType: 'image/jpeg', extension: 'jpg' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return { kind: 'image', mimeType: 'image/png', extension: 'png' };
  }

  // 3. WEBP: RIFF....WEBP (bytes 0-3: 52 49 46 46, bytes 8-11: 57 45 42 50)
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { kind: 'image', mimeType: 'image/webp', extension: 'webp' };
  }

  // 4. MP4 / MOV (ISO Base Media File Format: bytes 4-7 are 'ftyp' = 66 74 79 70)
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    const brand = buffer.subarray(8, 12).toString('ascii').toLowerCase();
    if (brand.startsWith('qt')) {
      return { kind: 'video', mimeType: 'video/quicktime', extension: 'mov' };
    }
    return { kind: 'video', mimeType: 'video/mp4', extension: 'mp4' };
  }

  // 5. QuickTime MOV legacy boxes (moov, mdat, wide, free, skip at bytes 4-7)
  const boxType = buffer.subarray(4, 8).toString('ascii');
  if (['moov', 'mdat', 'wide', 'free', 'skip'].includes(boxType)) {
    return { kind: 'video', mimeType: 'video/quicktime', extension: 'mov' };
  }

  return null;
}

/**
 * Scans for known executable signatures and text-based injection payloads
 * like polyglot SVG, XML, HTML, and script tags.
 */
function checkDangerousPayloads(buffer: Buffer): void {
  // Reject executable binaries
  // DOS / Windows PE: 'MZ' (0x4D, 0x5A)
  if (buffer.length >= 2 && buffer[0] === 0x4D && buffer[1] === 0x5A) {
    throw new UploadValidationError('Tập tin thực thi (PE/EXE) bị cấm.', 'FORBIDDEN_EXECUTABLE');
  }

  // ELF: 0x7F 'E' 'L' 'F' (0x7F, 0x45, 0x4C, 0x46)
  if (buffer.length >= 4 && buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) {
    throw new UploadValidationError('Tập tin thực thi (ELF) bị cấm.', 'FORBIDDEN_EXECUTABLE');
  }

  // Script shebang: '#!' (0x23, 0x21)
  if (buffer.length >= 2 && buffer[0] === 0x23 && buffer[1] === 0x21) {
    throw new UploadValidationError('Tập tin kịch bản (Script) bị cấm.', 'FORBIDDEN_SCRIPT');
  }

  // Mach-O / Java class: 0xCA, 0xFE, 0xBA, 0xBE
  if (buffer.length >= 4 && buffer[0] === 0xCA && buffer[1] === 0xFE && buffer[2] === 0xBA && buffer[3] === 0xBE) {
    throw new UploadValidationError('Tập tin nhị phân (Binary) bị cấm.', 'FORBIDDEN_BINARY');
  }

  // Scan text headers for embedded SVG, XML, HTML, or JavaScript scripts (Polyglot injection prevention)
  const headerCheckLen = Math.min(buffer.length, 4096);
  const headerText = buffer.subarray(0, headerCheckLen).toString('latin1').toLowerCase();

  const dangerousPatterns = [
    '<script',
    '</script',
    'javascript:',
    'vbscript:',
    '<svg',
    '<?xml',
    '<!doctype html',
    '<html',
    '<iframe',
    'onload=',
    'onerror=',
    'onclick=',
    'onmouseover='
  ];

  for (const pattern of dangerousPatterns) {
    if (headerText.includes(pattern)) {
      throw new UploadValidationError(
        `Tập tin chứa mã độc hại hoặc định dạng không được phép (${pattern}).`,
        'DANGEROUS_CONTENT'
      );
    }
  }
}

/**
 * Sanitizes folder paths, strictly blocking path traversal attempts (../, \\, null-bytes)
 * and normalizing segments to alphanumeric, hyphens, and underscores.
 */
export function sanitizeStorageFolderPath(folderPath?: string): string {
  if (!folderPath) return 'general';

  if (folderPath.includes('..') || folderPath.includes('\\') || folderPath.includes('\0')) {
    throw new UploadValidationError('Đường dẫn thư mục chứa ký tự không hợp lệ (path traversal).', 'INVALID_PATH');
  }

  const cleanSegments = folderPath
    .split('/')
    .map(seg => seg.replace(/[^a-zA-Z0-9_-]/g, '').trim())
    .filter(Boolean);

  if (cleanSegments.length === 0) {
    return 'general';
  }

  return cleanSegments.join('/');
}

export function generateSecureId(): string {
  return crypto.randomUUID();
}

/**
 * Comprehensive server-side validation for media uploads:
 * 1. Checks byte buffer size and limits
 * 2. Scans magic bytes for JPEG, PNG, WEBP, MP4, MOV
 * 3. Disallows dangerous extensions (SVG, HTML, JS, PHP, executable, etc.)
 * 4. Checks against script/HTML/binary payload injection
 * 5. Generates an unguessable UUID-based object key, preventing any applicant/user PII leakage
 */
export async function validateUpload(
  fileOrBuffer: File | Blob | Buffer,
  options: ValidateUploadOptions = {}
): Promise<ValidatedUploadResult> {
  let buffer: Buffer;
  let size: number;
  let originalFileName = options.originalFileName || '';
  let declaredMime = options.declaredMimeType || '';

  if (Buffer.isBuffer(fileOrBuffer)) {
    buffer = fileOrBuffer;
    size = buffer.length;
  } else if (fileOrBuffer instanceof Blob) {
    size = fileOrBuffer.size;
    declaredMime = fileOrBuffer.type || declaredMime;
    if ('name' in fileOrBuffer && typeof (fileOrBuffer as any).name === 'string') {
      originalFileName = (fileOrBuffer as any).name || originalFileName;
    }
    const arrayBuffer = await fileOrBuffer.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    throw new UploadValidationError('Dữ liệu tập tin không hợp lệ.', 'INVALID_FILE_INPUT');
  }

  if (size === 0 || buffer.length === 0) {
    throw new UploadValidationError('Tập tin trống (0 bytes).', 'EMPTY_FILE');
  }

  // 1. Validate original file name if present
  if (originalFileName) {
    if (
      originalFileName.includes('\0') ||
      originalFileName.includes('..') ||
      originalFileName.includes('/') ||
      originalFileName.includes('\\')
    ) {
      throw new UploadValidationError('Tên tập tin chứa ký tự không hợp lệ hoặc đường dẫn nguy hiểm.', 'PATH_TRAVERSAL');
    }

    const nameParts = originalFileName.toLowerCase().split('.');
    if (nameParts.length > 1) {
      for (let i = 1; i < nameParts.length; i++) {
        if (DANGEROUS_EXTENSIONS.has(nameParts[i])) {
          throw new UploadValidationError(
            `Phần mở rộng tập tin không được phép: .${nameParts[i]}`,
            'FORBIDDEN_EXTENSION'
          );
        }
      }
    }
  }

  // 2. Scan for dangerous payloads (PE, ELF, Scripts, Polyglot SVG/HTML)
  checkDangerousPayloads(buffer);

  // 3. Inspect magic bytes
  const detected = detectFileTypeFromMagicBytes(buffer);
  if (!detected) {
    throw new UploadValidationError(
      'Định dạng tập tin không được hỗ trợ hoặc chữ ký số (magic bytes) không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP, MP4, MOV.',
      'INVALID_MAGIC_BYTES'
    );
  }

  // 4. Validate allowed kinds (image vs video)
  const allowedKinds = options.allowedKinds || ['image', 'video'];
  if (!allowedKinds.includes(detected.kind)) {
    throw new UploadValidationError(
      `Loại tập tin ${detected.kind} không được phép tại vị trí này (chỉ cho phép: ${allowedKinds.join(', ')}).`,
      'DISALLOWED_KIND'
    );
  }

  // 5. Validate declared MIME type consistency if present
  if (declaredMime && declaredMime !== 'application/octet-stream') {
    const normalizedDeclared = declaredMime.toLowerCase().trim();
    if (detected.kind === 'image' && !normalizedDeclared.startsWith('image/')) {
      throw new UploadValidationError('MIME type không khớp với định dạng ảnh thực tế.', 'MIME_MISMATCH');
    }
    if (detected.kind === 'video' && !normalizedDeclared.startsWith('video/')) {
      throw new UploadValidationError('MIME type không khớp với định dạng video thực tế.', 'MIME_MISMATCH');
    }
  }

  // 6. Enforce file size limits
  const maxLimit = options.maxSizeBytes || (detected.kind === 'image' ? DEFAULT_MAX_IMAGE_SIZE : DEFAULT_MAX_VIDEO_SIZE);
  if (size > maxLimit) {
    const limitMB = (maxLimit / (1024 * 1024)).toFixed(0);
    const actualMB = (size / (1024 * 1024)).toFixed(1);
    throw new UploadValidationError(
      `Dung lượng tập tin (${actualMB}MB) vượt quá giới hạn cho phép (${limitMB}MB).`,
      'FILE_TOO_LARGE'
    );
  }

  // 7. Generate safe object key and path
  // If a descriptive fileName is provided (e.g. 'anh-chan-dung'), sanitize and use it; otherwise generate UUID
  const baseName = options.fileName
    ? options.fileName.replace(/[^a-zA-Z0-9_-]/g, '')
    : crypto.randomUUID();
  const safeFileName = `${baseName || crypto.randomUUID()}.${detected.extension}`;
  const safeFolder = sanitizeStorageFolderPath(options.folder);
  const storagePath = `${safeFolder}/${safeFileName}`;

  return {
    buffer,
    size,
    kind: detected.kind,
    mimeType: detected.mimeType,
    extension: detected.extension,
    safeFileName,
    safeFolder,
    storagePath
  };
}
