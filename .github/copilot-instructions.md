# GitHub Copilot Instructions - Particle Sparkle Effect

## Project Overview
This is a modern web implementation of the classic "Hanabi" fireworks particle effect, originally written in ActionScript 3 (AS3). The project recreates the distinctive sparkle/glow effect using HTML5 Canvas, TypeScript, and Svelte.

## Critical Architecture Differences: AS3 vs Modern Implementation

### Original ActionScript (hanabi.as) Architecture
The original AS3 version used a **single-canvas approach** with built-in Flash display features:
- Single `BitmapData` canvas with automatic compositing
- Built-in `BlendMode.ADD` for glow effects  
- Direct pixel manipulation with `setPixel32()`
- Automatic background handling (opaque black canvas)
- Built-in blur filters and color transforms applied directly to canvas content

### Modern Web Implementation Architecture
The modern version requires a **multi-layer approach** to maintain transparency and proper compositing:

```
Background Canvas (black, z-index: 0)
├── Glow Canvas (scaled 4x, blend mode, z-index: 1) 
└── Particle Canvas (transparent, z-index: 2)
```

## The Sparkle Effect Mechanism

### Original AS3 Method (DON'T replicate exactly)
```actionscript
// This approach breaks transparency in modern web
canvas.bitmapData.applyFilter(canvas.bitmapData, canvas.bitmapData.rect, zero, blur);
canvas.bitmapData.colorTransform(canvas.bitmapData.rect, colorTransform);
// Then copy to glow layer
glow.bitmapData.draw(canvas.bitmapData, new Matrix(0.25, 0, 0, 0.25));
```

### Modern Web Method (CORRECT approach)
```typescript
// 1. Keep particle canvas transparent - NO background fills
this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

// 2. Draw particles with life-based alpha for trails  
for (const particle of particles) {
    const alpha = particle.life / particle.maxLife;
    const color = this.adjustColorAlpha(particle.color, alpha);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.floor(particle.x), Math.floor(particle.y), 1, 1);
}

// 3. Create sparkle by scaling DOWN (pixel loss) then UP (aliasing)
this.glowCtx.drawImage(
    this.canvas, 0, 0, this.canvas.width, this.canvas.height,
    0, 0, this.glowCanvas.width, this.glowCanvas.height
);
```

## Critical "DO NOT" Rules

### ❌ NEVER apply effects directly to the main particle canvas:
```typescript
// This breaks transparency!
this.ctx.filter = 'blur(0.5px)';
this.ctx.drawImage(this.canvas, 0, 0);
this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
this.ctx.fillRect(0, 0, width, height);
```

### ❌ NEVER fill the main canvas with black background:
```typescript
// This breaks the layered compositing!
this.ctx.fillStyle = '#000000';
this.ctx.fillRect(0, 0, canvas.width, canvas.height);
```

### ❌ NEVER try to replicate AS3's single-canvas blur/colorTransform approach:
The AS3 approach worked because Flash handled compositing automatically. Modern web requires explicit layer management.

## Key Implementation Details

### Canvas Layer Responsibilities
1. **Background Canvas**: Static black background (`#000000`)
2. **Particle Canvas**: Transparent, sharp particles with alpha-based trails
3. **Glow Canvas**: Receives scaled-down copy of particle canvas, creates sparkle through pixel loss

### Sparkle Effect Technical Details
- **Pixel Loss**: Scaling particle canvas from full-size to 1/4 size causes random pixel loss/merging
- **Sparkle Creation**: Lost pixels mean only some particles contribute to glow (creates randomness)
- **Aliasing Effect**: Scaling back up 4x with `image-rendering: pixelated` creates the characteristic sparkle
- **Blend Modes**: CSS `mix-blend-mode: lighter` approximates AS3's `BlendMode.ADD`

### CSS Critical Settings
```css
.glow-canvas {
    transform: scale(4);
    transform-origin: top left;
    image-rendering: pixelated; /* Critical for sparkle - no smoothing */
    mix-blend-mode: lighter;    /* Approximates BlendMode.ADD */
    z-index: 1;
}

.particle-canvas {
    /* NO background - must stay transparent */
    z-index: 2;
}
```

### Particle Lifecycle
- Use `life` property (0.0 to 1.0) for alpha-based fading
- Apply gravity (0.2) and drag (0.9) like original
- Deactivate on low velocity OR life <= 0
- Bright, saturated colors for better glow effect

## Common Pitfalls When Modifying

1. **Breaking Transparency**: Any direct canvas effects (blur, fills) on particle canvas breaks layering
2. **Over-smoothing**: Using `image-rendering: auto` eliminates the sparkle effect  
3. **Wrong Blend Modes**: Modern blend modes don't exactly match AS3, test carefully
4. **Z-index Issues**: Background must be bottom, glow middle, particles top
5. **Scaling Issues**: Glow canvas must be exactly 1/4 size, scaled up 4x via CSS

## File Structure
- `HanabiEffect.ts`: Core particle system and rendering
- `HanabiDemo.svelte`: UI and canvas management  
- `Particle.ts`: Individual particle behavior
- `ParticlePool.ts`: Memory management
- `hanabi.as`: Original reference implementation (DO NOT copy directly)

## When Making Changes
Always test with "Side by Side" view to see individual layers. If particles appear on background or glow looks uniform, the transparency/layering is broken.

The goal is to maintain the visual fidelity of the original while respecting modern web transparency and compositing requirements.
