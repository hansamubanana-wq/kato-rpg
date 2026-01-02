import Phaser from 'phaser';
import { GAME_DATA, STAGES, ARTS, P, GAME_FONT } from './data.js';

export class BaseScene extends Phaser.Scene {
  constructor(key) { super(key); }

  // --- 基本機能 ---
  fadeInScene() { this.cameras.main.fadeIn(500, 0, 0, 0); }
  
  transitionTo(sceneKey, data) {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start(sceneKey, data);
      });
  }

  playBGM(key) { /* BGM再生処理（省略可） */ }
  playSound(key) { /* SE再生処理（省略可） */ }
  
  vibrate(pattern) {
      if (navigator.vibrate) navigator.vibrate(pattern);
  }

  // --- グラフィック生成系 ---
  
  // ドット絵テクスチャ生成
  createTextureFromText(key, data) {
      if(this.textures.exists(key)) return;
      const canvas = document.createElement('canvas');
      canvas.width = data[0].length; canvas.height = data.length;
      const ctx = canvas.getContext('2d');
      data.forEach((row, y) => {
          for(let x=0; x<row.length; x++) {
              const c = row[x];
              if(P[c]) { ctx.fillStyle = P[c]; ctx.fillRect(x, y, 1, 1); }
          }
      });
      this.textures.addCanvas(key, canvas);
      // ドット感を出すためにフィルタをニアレストネイバーに
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  createGameBackground(type) {
      this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x444444).setOrigin(0);
      const textureKey = `bg_${type}`;
      
      // 背景生成ロジック（簡易版）
      if(type === 'world') this.add.grid(0,0,this.scale.width,this.scale.height,32,32,0x000000).setOrigin(0).setAlpha(0.2);
      else if(type === 'battle') {
          this.add.rectangle(0,0,this.scale.width,this.scale.height,0x222222).setOrigin(0);
          // 黒板っぽいもの
          this.createTextureFromText('bg_bb', ARTS.bg_blackboard);
          this.add.sprite(this.scale.width/2, 100, 'bg_bb').setScale(20).setAlpha(0.5);
      }
      else if(type === 'skill') this.add.grid(0,0,this.scale.width,this.scale.height,40,40,0x002200).setOrigin(0).setAlpha(0.5);
      else if(type === 'shop') this.add.grid(0,0,this.scale.width,this.scale.height,40,40,0x000044).setOrigin(0).setAlpha(0.5);
      else if(type === 'secret') this.add.rectangle(0,0,this.scale.width,this.scale.height,0x220000).setOrigin(0);
  }

  startIdleAnimation(sprite) {
      this.tweens.add({
          targets: sprite, y: sprite.y + 5, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
  }

  // --- UIコンポーネント (豪華版) ---

  createPanel(x, y, w, h) {
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.8); g.lineStyle(4, 0xffffff, 1);
      g.fillRoundedRect(x, y, w, h, 10);
      g.strokeRoundedRect(x, y, w, h, 10);
      return g;
  }

  createButton(x, y, text, color, onClick, w=160, h=60, isDanger=false) {
      const c = this.add.container(x, y);
      const bg = this.add.graphics();
      
      const drawBtn = (isPressed) => {
          bg.clear();
          bg.fillStyle(color, 1);
          // 影をつける
          if(!isPressed) {
              bg.fillStyle(0x000000, 0.5);
              bg.fillRoundedRect(-w/2 + 4, -h/2 + 4, w, h, 10);
          }
          bg.fillStyle(color, 1);
          bg.lineStyle(2, 0xffffff, 1);
          // 押したときは少し小さく、位置をずらす
          const off = isPressed ? 2 : 0;
          bg.fillRoundedRect(-w/2 + off, -h/2 + off, w, h, 10);
          bg.strokeRoundedRect(-w/2 + off, -h/2 + off, w, h, 10);
      };
      
      drawBtn(false);

      const t = this.add.text(0, 0, text, { font: `20px ${GAME_FONT}`, color: '#fff' }).setOrigin(0.5);
      if(isDanger) t.setColor('#ffaaaa');

      const hit = this.add.rectangle(0, 0, w, h).setInteractive();
      
      // 【追加】押したときのアニメーション
      hit.on('pointerdown', () => {
          drawBtn(true);
          t.setPosition(2, 2);
          this.tweens.add({ targets: c, scale: 0.95, duration: 50, yoyo: true }); // ぷるんと縮む
          this.vibrate(10);
      });
      
      hit.on('pointerup', () => {
          drawBtn(false);
          t.setPosition(0, 0);
          onClick();
      });
      
      // キャンセル用（指が外れた時）
      hit.on('pointerout', () => {
          drawBtn(false);
          t.setPosition(0, 0);
      });

      c.add([bg, t, hit]);
      return c;
  }

  // --- バトル演出 (強化版) ---

  createHpBar(x, y, w, h, val, max) {
      const bg = this.add.rectangle(x, y, w, h, 0x333333).setOrigin(0, 0.5);
      const bar = this.add.rectangle(x, y, w * (val/max), h, 0x00ff00).setOrigin(0, 0.5);
      return {
          update: (v, m) => {
              const r = Math.max(0, v / m);
              // HPバーが減るときにアニメーションさせる
              this.tweens.add({
                  targets: bar, width: w * r, duration: 200, ease: 'Power2'
              });
              bar.fillColor = (r < 0.3) ? 0xff0000 : (r < 0.6 ? 0xffff00 : 0x00ff00);
          }
      };
  }

  createStressBar(x, y, w, h) {
      this.add.rectangle(x, y, w, h, 0x220000).setOrigin(0, 0.5).setStrokeStyle(1, 0x888888);
      const bar = this.add.rectangle(x, y, 0, h-2, 0xff0000).setOrigin(0, 0.5);
      return {
          update: (v, m) => {
              this.tweens.add({ targets: bar, width: (w-2) * (v/m), duration: 200 });
          }
      };
  }

  createApBar(x, y) {
      const container = this.add.container(x, y);
      const dots = [];
      for(let i=0; i<9; i++) {
          const d = this.add.circle(i*22, 0, 8, 0x222222).setStrokeStyle(1, 0x888888);
          container.add(d); dots.push(d);
      }
      return {
          update: (ap) => {
              dots.forEach((d, i) => {
                  d.fillColor = (i < ap) ? 0xffff00 : 0x222222;
                  d.setStrokeStyle(1, (i < ap) ? 0xffffaa : 0x444444);
                  // AP回復時に光らせる
                  if(i < ap && d.prevActive !== true) {
                      this.tweens.add({ targets: d, scale: 1.5, duration: 100, yoyo: true });
                  }
                  d.prevActive = (i < ap);
              });
          }
      };
  }

  // 【強化】ダメージポップアップ（跳ねる動き）
  showDamagePopup(x, y, dmg, isCrit) {
      const text = isCrit ? `${dmg}!!` : `${dmg}`;
      const color = isCrit ? '#ff0000' : '#ffffff';
      const size = isCrit ? '40px' : '28px';
      
      const t = this.add.text(x, y, text, {
          font: `${size} ${GAME_FONT}`, color: color, stroke: '#000', strokeThickness: 4
      }).setOrigin(0.5);

      // 跳ねるアニメーション
      this.tweens.chain({
          targets: t,
          tweens: [
              { y: y - 60, scale: 1.5, duration: 150, ease: 'Back.Out' }, // 飛び出す
              { y: y - 40, scale: 1.0, duration: 100, ease: 'Linear' },   // 少し戻る
              { alpha: 0, y: y - 80, duration: 500, delay: 300 }          // 消える
          ],
          onComplete: () => t.destroy()
      });
  }

  showStatusPopup(x, y, text) {
      const t = this.add.text(x, y, text, { font: `20px ${GAME_FONT}`, color: '#ff88ff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
      this.tweens.add({ targets: t, y: y-40, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
  }

  showApPopup(x, y) {
      const t = this.add.text(x, y, "AP+1", { font: `24px ${GAME_FONT}`, color: '#ffff00', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
      this.tweens.add({ targets: t, y: y-50, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  // 【強化】ヒットエフェクト（火花パーティクル）
  createImpactEffect(x, y) {
      // 衝撃波リング
      const c = this.add.circle(x, y, 10, 0xffffff, 0.8);
      this.tweens.add({ targets: c, scale: 5, alpha: 0, duration: 200, onComplete: () => c.destroy() });

      // 火花を散らす
      for(let i=0; i<8; i++) {
          const p = this.add.rectangle(x, y, 4, 4, 0xffff00);
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
      this.cameras.main.shake(300, 0.02);
      // 連続で爆発
      for(let i=0; i<5; i++) {
          this.time.delayedCall(i*100, () => {
              const ox = (Math.random()-0.5)*100;
              const oy = (Math.random()-0.5)*100;
              this.createImpactEffect(x+ox, y+oy);
          });
      }
  }

  // リストUI用 (スクロール機能付き)
  initScrollView(contentHeight, x, y, width=340, height=400) {
      const container = this.add.container(x, y);
      const maskShape = this.make.graphics();
      maskShape.fillStyle(0xffffff);
      maskShape.fillRect(0, y, this.scale.width, height); // 画面幅全体をマスク対象に
      const mask = maskShape.createGeometryMask();
      container.setMask(mask);

      // スクロール処理
      let dragY = 0;
      let startY = 0;
      const zone = this.add.zone(0, 0, this.scale.width, height).setOrigin(0).setInteractive();
      
      zone.on('pointerdown', (p) => { startY = p.y - container.y; });
      zone.on('pointermove', (p) => {
          if (p.isDown) {
              dragY = p.y - startY;
              // 範囲制限
              const minY = -contentHeight + height;
              if (dragY > y) dragY = y;
              if (dragY < y + minY) dragY = y + minY;
              container.y = dragY;
          }
      });
      // コンテナに追加せず、シーンに直接置くことでコンテナごと動かすためのハンドルにする
      // しかしBaseSceneの構造上、リストの親コンテナ自体を動かす設計にする
      return container;
  }
  
  // スクロール可能なボタン（リスト用）
  createScrollableButton(x, y, text, color, onClick, w, h, desc="", rightText="") {
      const c = this.add.container(x, y);
      const bg = this.add.graphics();
      bg.fillStyle(color, 1).lineStyle(1, 0x888888).fillRoundedRect(-w/2, -h/2, w, h, 8).strokeRoundedRect(-w/2, -h/2, w, h, 8);
      
      const t = this.add.text(-w/2 + 20, -10, text, { font: `20px ${GAME_FONT}`, color: '#fff' }).setOrigin(0, 0.5);
      const d = this.add.text(-w/2 + 20, 15, desc, { font: `12px ${GAME_FONT}`, color: '#ccc' }).setOrigin(0, 0.5);
      const r = this.add.text(w/2 - 20, 0, rightText, { font: `16px ${GAME_FONT}`, color: '#ff0', align:'right' }).setOrigin(1, 0.5);

      const hit = this.add.rectangle(0, 0, w, h).setInteractive();
      hit.on('pointerdown', () => { 
          this.vibrate(10);
          this.tweens.add({targets:c, scale:0.98, duration:50, yoyo:true});
          onClick(); 
      });
      
      c.add([bg, t, d, r, hit]);
      c.rightTextObj = r; // 外部から色変更用
      return c;
  }
  
  openWindowAnimation(container) {
      container.setVisible(true);
      container.setScale(0.8);
      container.setAlpha(0);
      this.tweens.add({
          targets: container,
          scale: 1,
          alpha: 1,
          duration: 200,
          ease: 'Back.Out'
      });
  }
}