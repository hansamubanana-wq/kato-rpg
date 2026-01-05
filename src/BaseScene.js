import Phaser from 'phaser';
import { GAME_FONT, P, ARTS } from './data.js';

export class BaseScene extends Phaser.Scene {
  preload() {
    Object.keys(ARTS).forEach(k => this.createTextureFromText(k, ARTS[k]));
    
    this.load.audio('bgm_world', '/sounds/bgm_world.mp3');
    this.load.audio('bgm_battle', '/sounds/bgm_battle.mp3');
    this.load.audio('se_select', '/sounds/se_select.mp3');
    this.load.audio('se_attack', '/sounds/se_attack.mp3');
    this.load.audio('se_parry', '/sounds/se_parry.mp3');
    // se_win は存在しないので削除しました
  }

  createTextureFromText(key, art) {
    if (this.textures.exists(key)) return;
    const cvs = document.createElement('canvas'); cvs.width = art[0].length; cvs.height = art.length;
    const ctx = cvs.getContext('2d');
    for (let y=0; y<art.length; y++) for (let x=0; x<art[0].length; x++) if (P[art[y][x]]) { ctx.fillStyle = P[art[y][x]]; ctx.fillRect(x,y,1,1); }
    this.textures.addCanvas(key, cvs);
    this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  playSound(key, config = {}) { if (this.sound.get(key) || this.cache.audio.exists(key)) this.sound.play(key, config); }
  
  playBGM(key) {
      const current = this.sound.getAll('bgm_world').concat(this.sound.getAll('bgm_battle'));
      let isPlaying = false;
      current.forEach(sound => {
          if (sound.key === key && sound.isPlaying) isPlaying = true;
          else sound.stop();
      });
      if (!isPlaying) this.playSound(key, { loop: true, volume: 0.5 });
  }

  vibrate(pattern) { if (navigator.vibrate) navigator.vibrate(pattern); }

  hitStop(duration) {
      this.tweens.timeScale = 0.1; 
      this.time.delayedCall(duration, () => { 
          this.tweens.timeScale = 1.0;
      });
  }

  damageFlash(target) {
      if(!target || !target.scene) return;
      target.setTintFill(0xffffff); 
      this.tweens.add({
          targets: target,
          x: target.x + (Math.random() < 0.5 ? 10 : -10),
          duration: 50,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
              target.clearTint();
          }
      });
  }

  transitionTo(sceneName, data={}) {
      this.cameras.main.fadeOut(500, 0, 0, 0); 
      this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start(sceneName, data); });
  }
  
  fadeInScene() { this.cameras.main.fadeIn(500, 0, 0, 0); }

  createGameBackground(type) {
    const w = this.scale.width; const h = this.scale.height;
    const bgContainer = this.add.container(0, 0).setDepth(-100);
    const wall = this.add.graphics(); const floor = this.add.graphics();
    let wallColor = 0xffeebb; let floorColor = 0x885522;
    if(type==='shop') { wallColor = 0xaaccff; floorColor = 0xcccccc; }
    if(type==='skill') { wallColor = 0xaaaaaa; floorColor = 0x666666; }
    if(type==='battle') { wallColor = 0x552255; floorColor = 0x221122; }
    if(type==='secret') { wallColor = 0x220000; floorColor = 0x110000; }

    wall.fillStyle(wallColor, 1).fillRect(0, 0, w, h*0.6);
    floor.fillStyle(floorColor, 1).fillRect(0, h*0.6, w, h*0.4);
    const noise = this.add.graphics(); noise.fillStyle(0x000000, 0.05);
    for(let y=0; y<h; y+=4) for(let x=0; x<w; x+=4) if(Math.random()>0.5) noise.fillRect(x,y,4,4);
    bgContainer.add([wall, floor, noise]);
    
    if (type === 'world') {
        if(this.textures.exists('bg_blackboard')) bgContainer.add(this.add.sprite(w/2, h*0.3, 'bg_blackboard').setScale(10).setAlpha(0.7));
    } else if (type === 'shop') {
        if(this.textures.exists('bg_shelf')) for(let i=0; i<3; i++) bgContainer.add(this.add.sprite(60+i*140, h*0.4, 'bg_shelf').setScale(6));
    } else if (type === 'skill') {
        if(this.textures.exists('bg_locker')) for(let i=0; i<4; i++) bgContainer.add(this.add.sprite(50+i*100, h*0.4, 'bg_locker').setScale(6));
    } else if (type === 'battle') {
        if(this.textures.exists('bg_window_sunset')) for(let i=0; i<2; i++) bgContainer.add(this.add.sprite(100+i*200, h*0.3, 'bg_window_sunset').setScale(8).setAlpha(0.8));
        bgContainer.add(this.add.rectangle(w/2, h/2, w, h, 0x440000, 0.3));
    }
    bgContainer.add(this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.3));
  }

  startIdleAnimation(target) {
      this.tweens.add({ targets: target, y: '+=10', duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  showDamagePopup(x, y, amount, isCrit) {
      let color = isCrit ? '#ff0000' : '#ffffff'; 
      let text = isCrit ? `${amount}!!` : `${amount}`;
      const t = this.add.text(x, y, text, { font: isCrit?'48px '+GAME_FONT:'32px '+GAME_FONT, color: color, stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(200);
      
      this.tweens.chain({
          targets: t,
          tweens: [
              { y: y - 60, scale: isCrit ? 1.5 : 1.2, duration: 150, ease: 'Back.Out' },
              { y: y - 40, scale: 1.0, duration: 100, ease: 'Linear' },
              { alpha: 0, y: y - 80, duration: 500, delay: 300 }
          ],
          onComplete: () => t.destroy()
      });
  }

  showApPopup(x, y) {
      const t = this.add.text(x, y, "AP+1", { font: `32px ${GAME_FONT}`, color: '#ff0', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(200);
      this.tweens.add({ targets: t, y: y-60, alpha: 0, duration: 800, ease: 'Sine.Out', onComplete: ()=>t.destroy() });
  }

  showStatusPopup(x, y, text) {
      const t = this.add.text(x, y, text, { font: `28px ${GAME_FONT}`, color: '#f0f', stroke: '#fff', strokeThickness: 4 }).setOrigin(0.5).setDepth(200);
      this.tweens.add({ targets: t, y: y-60, alpha: 0, duration: 1500, ease: 'Sine.Out', onComplete: ()=>t.destroy() });
  }

  openWindowAnimation(c) { c.setScale(0); c.setVisible(true); this.tweens.add({ targets: c, scale: 1, duration: 400, ease: 'Back.Out' }); }

  createImpactEffect(x, y) {
      const c = this.add.circle(x, y, 10, 0xffffff);
      this.tweens.add({ targets: c, scale: 2.0, alpha: 0, duration: 200, onComplete: () => c.destroy() });

      for(let i=0; i<8; i++){ 
          const p = this.add.rectangle(x, y, 6, 6, 0xffff00);
          const angle = Phaser.Math.Between(0, 360);
          const speed = Phaser.Math.Between(30, 80);
          const rad = Phaser.Math.DegToRad(angle);
          
          this.tweens.add({
              targets: p,
              x: x + Math.cos(rad) * speed,
              y: y + Math.sin(rad) * speed,
              alpha: 0,
              angle: angle,
              duration: 300,
              ease: 'Quad.Out',
              onComplete: () => p.destroy()
          });
      }
  }
  
  createExplosion(x, y) {
      for(let i=0; i<20; i++) {
          const p = this.add.rectangle(x, y, 8, 8, Phaser.Utils.Array.GetRandom([0xff0000, 0xffaa00, 0xffff00, 0xffffff]));
          const angle = Phaser.Math.Between(0, 360) * (Math.PI/180);
          const speed = Phaser.Math.Between(50, 150);
          this.tweens.add({
              targets: p, x: x + Math.cos(angle) * speed, y: y + Math.sin(angle) * speed, alpha: 0, scale: 0.1, angle: 360, duration: 800, ease: 'Power2', onComplete: () => p.destroy()
          });
      }
      this.cameras.main.shake(300, 0.05);
  }

  createPanel(x, y, w, h) {
    this.add.graphics().fillStyle(0x000, 0.5).fillRoundedRect(x+4, y+4, w, h, 10);
    const bg = this.add.graphics(); bg.fillStyle(0x002244, 0.95).lineStyle(2, 0xfff, 1).fillRoundedRect(x, y, w, h, 10).strokeRoundedRect(x, y, w, h, 10);
    return bg;
  }

  createButton(x, y, text, color, cb, w=160, h=60, isPulse=false) {
    const c = this.add.container(x, y);
    const vc = this.add.container(0, 0);
    
    const bgGraphics = this.add.graphics();
    const drawBtn = (pressed) => {
        bgGraphics.clear();
        if(!pressed) {
            bgGraphics.fillStyle(0x000000, 0.5);
            bgGraphics.fillRoundedRect(-w/2+4, -h/2+4, w, h, 8);
        }
        bgGraphics.fillStyle(color, 1);
        bgGraphics.lineStyle(2, 0xffffff, 1);
        const off = pressed ? 2 : 0;
        bgGraphics.fillRoundedRect(-w/2+off, -h/2+off, w, h, 8);
        bgGraphics.strokeRoundedRect(-w/2+off, -h/2+off, w, h, 8);
    };
    drawBtn(false);

    const tx = this.add.text(0, 0, text, { font: `20px ${GAME_FONT}`, color: '#fff' }).setOrigin(0.5);
    vc.add([bgGraphics, tx]);
    
    if (isPulse) this.tweens.add({ targets: vc, scale: 1.05, duration: 800, yoyo: true, repeat: -1 });
    
    const hit = this.add.rectangle(0, 0, w, h).setInteractive();
    
    hit.on('pointerdown', () => { 
        drawBtn(true);
        tx.setPosition(2, 2);
        this.tweens.add({ targets: vc, scale: 0.95, duration: 50, yoyo: true });
        this.vibrate(5); 
    });
    
    hit.on('pointerup', () => { 
        drawBtn(false);
        tx.setPosition(0, 0);
        this.playSound('se_select'); 
        cb(); 
    });
    
    hit.on('pointerout', () => {
        drawBtn(false);
        tx.setPosition(0, 0);
    });

    c.add([vc, hit]);
    c.list = [vc, hit]; 
    return c;
  }

  createScrollableButton(x, y, text, color, cb, w=220, h=50, subText="", rightText="") {
    const c = this.add.container(x, y);
    const vc = this.add.container(0, 0);
    const sh = this.add.graphics().fillStyle(0x000, 0.5).fillRoundedRect(-w/2+4, -h/2+4, w, h, 8);
    const bg = this.add.graphics().fillStyle(color, 1).lineStyle(2, 0xfff).fillRoundedRect(-w/2, -h/2, w, h, 8).strokeRoundedRect(-w/2, -h/2, w, h, 8);
    const tx = this.add.text(w>220? -w/2 + 20 : 0, -5, text, { font: `22px ${GAME_FONT}`, color: '#fff' }).setOrigin(w>220?0:0.5, 0.5);
    vc.add([sh, bg, tx]);
    if(subText) {
        const sub = this.add.text(w>220? -w/2 + 20 : 0, 18, subText, { font: `14px ${GAME_FONT}`, color: '#ccc' }).setOrigin(w>220?0:0.5, 0.5);
        vc.add(sub);
    }
    if(rightText) {
        const rt = this.add.text((w/2) - 20, 0, rightText, { font: `22px ${GAME_FONT}`, color: '#ff0' }).setOrigin(1, 0.5);
        vc.add(rt);
        c.rightTextObj = rt; 
    }
    
    const hit = this.add.rectangle(0, 0, w, h, 0x000, 0).setInteractive();
    let startY = 0;
    
    hit.on('pointerdown', (pointer) => { 
        startY = pointer.y;
        this.tweens.add({ targets: vc, scale: 0.98, duration: 50, yoyo: true });
        this.vibrate(5);
    });
    
    hit.on('pointerup', (pointer) => { 
        if (Math.abs(pointer.y - startY) < 10) {
            this.playSound('se_select'); 
            cb(); 
        }
    });
    
    c.add([vc, hit]);
    return c;
  }

  createHpBar(x, y, w, h, val, max) {
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, 0x000).setOrigin(0, 0.5).setStrokeStyle(2, 0xfff);
    const bar = this.add.rectangle(0, 0, w, h-4, 0x0f0).setOrigin(0, 0.5);
    c.update = (v, m) => { 
        const r = Math.max(0, Math.min(1, v/m)); 
        this.tweens.add({ targets: bar, width: (w-4)*r, duration: 200, ease: 'Power2' });
        bar.fillColor = r<0.25?0xf00:r<0.5?0xff0:0x0f0; 
    };
    c.update(val, max); c.add([bg, bar]); return c;
  }
  
  createStressBar(x, y, w, h) {
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, 0x000).setOrigin(0, 0.5).setStrokeStyle(2, 0xfff);
    const bar = this.add.rectangle(0, 0, 0, h-4, 0xfa0).setOrigin(0, 0.5); 
    c.update = (v, m) => { 
        const r = Math.min(1, v/m); 
        this.tweens.add({ targets: bar, width: (w-4)*r, duration: 200 });
        bar.fillColor = r>=1?0xfff:0xfa0; 
    };
    c.add([bg, bar]); return c;
  }
  
  createApBar(x, y) {
      const container = this.add.container(x, y);
      const boxes = [];
      const size = 14; const margin = 6;
      for (let i = 0; i < 9; i++) {
          const bg = this.add.rectangle(i * (size + margin), 0, size, size, 0x333333).setStrokeStyle(1, 0x888888);
          const fill = this.add.rectangle(i * (size + margin), 0, size - 2, size - 2, 0xffff00).setVisible(false);
          container.add([bg, fill]); boxes.push(fill);
      }
      container.update = (currentAp) => { 
          boxes.forEach((box, index) => { 
              box.setVisible(index < currentAp); 
              if(index < currentAp && box.alpha === 0) {
                  box.setAlpha(0); box.setScale(1.5);
                  this.tweens.add({ targets: box, alpha: 1, scale: 1, duration: 150 });
              }
          }); 
      };
      container.add(this.add.text(-30, -8, "AP", { fontSize: '16px', color: '#ff0', fontStyle: 'bold' }));
      return container;
  }

  initScrollView(contentHeight, maskY, maskH) {
      this.scrollContainer = this.add.container(0, maskY);
      const shape = this.make.graphics(); shape.fillStyle(0xffffff); shape.fillRect(0, maskY, this.scale.width, maskH);
      const mask = shape.createGeometryMask(); this.scrollContainer.setMask(mask);
      
      const minScroll = Math.min(0, maskH - contentHeight - 50); 
      const maxScroll = 0;
      let dragStartY = 0; 
      let containerStartY = 0;
      let isDragging = false;

      this.input.on('pointerdown', (pointer) => {
          if (pointer.y >= maskY && pointer.y <= maskY + maskH) {
              isDragging = true;
              dragStartY = pointer.y;
              containerStartY = this.scrollContainer.y;
          }
      });

      this.input.on('pointermove', (pointer) => {
          if (isDragging && pointer.isDown) {
              const diff = pointer.y - dragStartY;
              this.scrollContainer.y = Phaser.Math.Clamp(containerStartY + diff, minScroll + maskY, maxScroll + maskY);
          }
      });

      this.input.on('pointerup', () => {
          isDragging = false;
      });

      return this.scrollContainer;
  }
}