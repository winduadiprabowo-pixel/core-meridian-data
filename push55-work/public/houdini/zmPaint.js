/**
 * zmPaint.js — ZERØ MERIDIAN 2026 Phase 9
 * CSS Houdini Paint Worklet.
 * Registered via: CSS.paintWorklet.addModule('/houdini/zmPaint.js')
 * Custom properties consumed: --zm-trend | --zm-intensity | --zm-hue
 */

/* global registerPaint */

class ZMAuroraGrid {
  static get inputProperties() { return ['--zm-trend','--zm-intensity','--zm-hue']; }
  paint(ctx, geom, props) {
    const W=geom.width, H=geom.height;
    const trend=parseFloat(props.get('--zm-trend')?.toString()??'0');
    const intensity=parseFloat(props.get('--zm-intensity')?.toString()??'0.5');
    const hue=parseFloat(props.get('--zm-hue')?.toString()??'220');
    ctx.fillStyle='rgba(5,5,14,0.98)';ctx.fillRect(0,0,W,H);
    const a=0.06*intensity;
    const c1=trend>=0?'rgba(52,211,153,'+a+')':'rgba(251,113,133,'+a+')';
    const c2='rgba(96,165,250,'+(0.04*intensity)+')';
    const g1=ctx.createRadialGradient(W*0.15,H*0.3,0,W*0.15,H*0.3,W*0.5);
    g1.addColorStop(0,c1);g1.addColorStop(1,'transparent');
    ctx.fillStyle=g1;ctx.fillRect(0,0,W,H);
    const g2=ctx.createRadialGradient(W*0.85,H*0.7,0,W*0.85,H*0.7,W*0.45);
    g2.addColorStop(0,c2);g2.addColorStop(1,'transparent');
    ctx.fillStyle=g2;ctx.fillRect(0,0,W,H);
    const GS=32;
    ctx.strokeStyle='rgba('+(hue>180?'96,165,250':'154,230,180')+',0.04)';ctx.lineWidth=0.5;
    for(let x=0;x<W;x+=GS){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=GS){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.fillStyle='rgba(0,0,0,0.015)';
    for(let y=0;y<H;y+=2)ctx.fillRect(0,y,W,1);
  }
}

class ZMPriceBg {
  static get inputProperties() { return ['--zm-trend','--zm-intensity']; }
  paint(ctx, geom, props) {
    const W=geom.width,H=geom.height;
    const trend=parseFloat(props.get('--zm-trend')?.toString()??'0');
    const intensity=parseFloat(props.get('--zm-intensity')?.toString()??'0.5');
    ctx.fillStyle='rgba(8,10,18,0.97)';ctx.fillRect(0,0,W,H);
    const a=0.08*Math.abs(trend)*intensity;
    const c=trend>=0?'rgba(52,211,153,'+a+')':'rgba(251,113,133,'+a+')';
    const g=ctx.createLinearGradient(0,H,0,0);g.addColorStop(0,c);g.addColorStop(0.5,'transparent');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.fillStyle=trend>=0?'rgba(52,211,153,'+(0.15*Math.abs(trend)*intensity)+')':'rgba(251,113,133,'+(0.15*Math.abs(trend)*intensity)+')';
    ctx.fillRect(0,H-1,W,1);
  }
}

class ZMNoiseTile {
  static get inputProperties() { return ['--zm-intensity']; }
  paint(ctx, geom, props) {
    const W=geom.width,H=geom.height;
    const intensity=parseFloat(props.get('--zm-intensity')?.toString()??'0.3');
    ctx.fillStyle='rgba(8,10,18,1)';ctx.fillRect(0,0,W,H);
    const img=ctx.createImageData(W,H);const d=img.data;
    for(let i=0;i<d.length;i+=4){
      const px=(i/4)%W,py=Math.floor((i/4)/W);
      const n=((px*127+py*311)^(px*53))&0xFF;
      const g=(n/255)*intensity*20;
      d[i]=g;d[i+1]=g;d[i+2]=g;d[i+3]=Math.floor(g*0.8);
    }
    ctx.putImageData(img,0,0);
  }
}

registerPaint('zm-aurora-grid', ZMAuroraGrid);
registerPaint('zm-price-bg',    ZMPriceBg);
registerPaint('zm-noise-tile',  ZMNoiseTile);
