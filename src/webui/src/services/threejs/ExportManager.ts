/**
 * ExportManager Service
 *
 * Handles 2D export (PNG screenshots) of the 3D view
 */

import * as THREE from 'three';

export interface ExportOptions {
  /** Width of the exported image (default: current canvas width) */
  width?: number;

  /** Height of the exported image (default: current canvas height) */
  height?: number;

  /** Image quality (0-1, only for jpeg) */
  quality?: number;

  /** Image format */
  format?: 'png' | 'jpeg';

  /** Include transparent background (PNG only) */
  transparent?: boolean;

  /** Background color (if not transparent) */
  backgroundColor?: string;

  /** Filename for download */
  filename?: string;
}

export interface ExportResult {
  /** Data URL of the exported image */
  dataUrl: string;

  /** Blob of the exported image */
  blob: Blob;

  /** Width of the exported image */
  width: number;

  /** Height of the exported image */
  height: number;

  /** File size in bytes */
  size: number;

  /** Timestamp of export */
  timestamp: Date;
}

/**
 * Service for exporting 2D screenshots
 */
export class ExportManager {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.Camera | null = null;

  constructor(
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene,
    camera?: THREE.Camera
  ) {
    this.renderer = renderer || null;
    this.scene = scene || null;
    this.camera = camera || null;
  }

  /**
   * Set the renderer
   */
  setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
  }

  /**
   * Set the scene
   */
  setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }

  /**
   * Set the camera
   */
  setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  /**
   * Export current view as PNG/JPEG
   */
  async exportImage(options: ExportOptions = {}): Promise<ExportResult> {
    if (!this.renderer || !this.scene || !this.camera) {
      throw new Error('Renderer, scene, and camera must be set before exporting');
    }

    const {
      width = this.renderer.domElement.width,
      height = this.renderer.domElement.height,
      quality = 0.92,
      format = 'png',
      transparent = false,
      backgroundColor,
      filename = `export-${Date.now()}.${format}`
    } = options;

    // Store original state
    const originalSize = this.renderer.getSize(new THREE.Vector2());
    const originalPixelRatio = this.renderer.getPixelRatio();
    const originalBackground = this.scene.background;
    const originalAlpha = this.renderer.getClearAlpha();

    try {
      // Set export size and pixel ratio
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(1); // Use 1:1 pixel ratio for export

      // Handle background
      if (transparent && format === 'png') {
        this.scene.background = null;
        this.renderer.setClearAlpha(0);
      } else if (backgroundColor) {
        this.scene.background = new THREE.Color(backgroundColor);
      }

      // Render the scene
      this.renderer.render(this.scene, this.camera);

      // Get image data
      const dataUrl = this.renderer.domElement.toDataURL(
        format === 'png' ? 'image/png' : 'image/jpeg',
        quality
      );

      // Convert to blob
      const blob = await this.dataUrlToBlob(dataUrl);

      const result: ExportResult = {
        dataUrl,
        blob,
        width,
        height,
        size: blob.size,
        timestamp: new Date()
      };

      return result;

    } finally {
      // Restore original state
      this.renderer.setSize(originalSize.x, originalSize.y);
      this.renderer.setPixelRatio(originalPixelRatio);
      this.scene.background = originalBackground;
      this.renderer.setClearAlpha(originalAlpha);

      // Re-render with original settings
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Export and download image
   */
  async exportAndDownload(options: ExportOptions = {}): Promise<ExportResult> {
    const result = await this.exportImage(options);

    const {
      format = 'png',
      filename = `export-${Date.now()}.${format}`
    } = options;

    // Create download link
    const link = document.createElement('a');
    link.href = result.dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return result;
  }

  /**
   * Export view with specific camera position (for section views)
   */
  async exportSection(
    cameraPosition: THREE.Vector3,
    targetPosition: THREE.Vector3,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    if (!this.camera) {
      throw new Error('Camera must be set before exporting');
    }

    // Store original camera state
    const originalPosition = this.camera.position.clone();
    const originalQuaternion = this.camera.quaternion.clone();

    try {
      // Set camera position
      this.camera.position.copy(cameraPosition);
      this.camera.lookAt(targetPosition);
      this.camera.updateProjectionMatrix();

      // Export
      return await this.exportImage(options);

    } finally {
      // Restore original camera state
      this.camera.position.copy(originalPosition);
      this.camera.quaternion.copy(originalQuaternion);
      this.camera.updateProjectionMatrix();
    }
  }

  /**
   * Export orthographic view (for 2D-like sections)
   */
  async exportOrthographic(
    axis: 'x' | 'y' | 'z',
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    if (!this.scene || !this.camera) {
      throw new Error('Scene and camera must be set before exporting');
    }

    // Calculate bounding box of scene
    const box = new THREE.Box3().setFromObject(this.scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Create orthographic camera
    const aspect = (options.width || this.renderer!.domElement.width) /
                   (options.height || this.renderer!.domElement.height);
    const orthoCamera = new THREE.OrthographicCamera(
      -maxDim * aspect / 2,
      maxDim * aspect / 2,
      maxDim / 2,
      -maxDim / 2,
      0.1,
      maxDim * 10
    );

    // Position camera based on axis
    switch (axis) {
      case 'x':
        orthoCamera.position.set(center.x + maxDim * 2, center.y, center.z);
        break;
      case 'y':
        orthoCamera.position.set(center.x, center.y + maxDim * 2, center.z);
        break;
      case 'z':
        orthoCamera.position.set(center.x, center.y, center.z + maxDim * 2);
        break;
    }

    orthoCamera.lookAt(center);
    orthoCamera.updateProjectionMatrix();

    // Store original camera
    const originalCamera = this.camera;

    try {
      // Temporarily use orthographic camera
      this.camera = orthoCamera;

      return await this.exportImage(options);

    } finally {
      // Restore original camera
      this.camera = originalCamera;
    }
  }

  /**
   * Convert data URL to Blob
   */
  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
  }

  /**
   * Get formatted file size string
   */
  static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    // Nothing to dispose for now
  }
}
