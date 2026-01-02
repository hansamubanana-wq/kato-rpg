// ================================================================
//  データ & 定数定義
// ================================================================
export const GAME_FONT = 'DotGothic16';
export const SAVE_KEY = 'kato_rpg_save_v3';

// ドット絵データ
export const P = { '.':null, '0':'#000', '1':'#ffe0c0', '2':'#fff', '3':'#228', '4':'#fcc', '5':'#c00', '6':'#420', '7':'#333', '8':'#aaa', '9':'#ff0', 'A':'#f00' };
export const ARTS = {
  kato: ["......0000......",".....000000.....","....00000000....","....00000000....","....01111110....","....03111130....","....01111110....",".....222222.....","....22233222....","....22222222....","....22222222....",".....33..33.....",".....33..33.....",".....00..00....."],
  kato_cutin: [".......0000.......","......000000......",".....00000000.....",".....00000000.....",".....01111110.....","....01A1111A10....","....0111111110....","....0111111110....",".....01111110.....","......222222......",".....22222222....."],
  dozo: ["......0000......",".....000000.....","....00000000....","....01111110....","....01011010....","....01111110....","...333333333....","...333333333....","...333333333....","...333333333....","....3333333.....","....77...77.....","....77...77.....","....00...00....."],
  maeda: ["......0000......",".....000000.....","....00000000....","....01111110....","....01011010....","....01111110....",".....888888.....","....88888888....","....88888888....","....88888888....","....77777777....","....77....77....","....77....77....","....00....00...."],
  matsuda: [".....000000.....","....00000000....","...000000000....","...011111110....","...010110110....","...041111140....","...011151110....","...444444444....","..44444444444...","..44444444444...","..44444444444...","...333...333....","...333...333....","...000...000...."],
  kitai: [".....666666.....","....66666666....","...666666666....","...661111166....","...661010166....","...661111166....","...661111166....","....2222222.....","...222222222....","...222222222....","....7777777.....","....77...77.....","....77...77.....","....00...00....."],
  fukumorita: ["......0000......",".....000000.....","....00000000....","....01111110....","....01011010....","....01111110....","....7777777.....","...777777777....","...777222777....","...777777777....","...777777777....","....77...77.....","....77...77.....","....22...22....."],
  aota: ["......0000......",".....000000.....","....00....00....","....01111110....","....01011010....","....01111110....",".....223322.....","....33333333....","....33333333....","....33333333....","....77777777....","....77....77....","....77....77....","....00....00...."],
  kingetsu: [".....66..66.....","....666..666....","...6666..6666...","...6111111116...","...6101111016...","...6111111116...","...6111111116...","...2222222222...","..222222222222..","..222222222222..","..777777777777..","...777....777...","...777....777...","...000....000..."],
  bg_blackboard: ["BBBBBBBBBBBBBBBB","B00000000000000B","B0AAAAAAAAAAAA0B","B0AAAAAAAAAAAA0B","B0AAAAAAAAAAAA0B","B0AAAAAAAAAAAA0B","B0AAAAAAAAAAAA0B","B00000000000000B","BBBBBBBBBBBBBBBB"],
  bg_window: ["DDDDDDDD","D222222D","D222222D","D222222D","DDDDDDDD","D222222D","D222222D","D222222D","DDDDDDDD"],
  bg_shelf: ["BBBBBBBB","B992299B","BBBBBBBB","B292922B","BBBBBBBB","B922992B","BBBBBBBB"],
  bg_locker: ["CCCCCCCC","C888888C","C878888C","C888888C","C888888C","C888888C","C888888C","CCCCCCCC"],
  bg_window_sunset: ["EEEEEEEE","E555555E","E555555E","E555555E","EEEEEEEE","E555555E","E555555E","E555555E","EEEEEEEE"]
};

// 敵データ
export const STAGES = [
  { id: 0, name: '土蔵', hp: 150, atk: 12, exp: 20, gold: 100, key: 'dozo' },
  { id: 1, name: '前田', hp: 300, atk: 18, exp: 40, gold: 150, key: 'maeda' },
  { id: 2, name: '松田先生', hp: 600, atk: 25, exp: 80, gold: 250, key: 'matsuda' },
  { id: 3, name: '北井先生', hp: 1200, atk: 35, exp: 120, gold: 400, key: 'kitai' },
  { id: 4, name: '福盛田先生', hp: 2500, atk: 45, exp: 200, gold: 600, key: 'fukumorita' },
  { id: 5, name: '青田校長', hp: 5000, atk: 60, exp: 500, gold: 1000, key: 'aota' },
  { id: 6, name: '金月', hp: 10000, atk: 99, exp: 1000, gold: 2000, key: 'kingetsu' }
];

// スキルデータ
export const SKILL_DB = [
  { id: 1, name: '出席確認', type: 'attack', power: 15, speed: 1.0, cost: 0, apCost: 1, anim:'normal', status: null, desc: '基本攻撃。確実に出席をとる。' },
  { id: 3, name: '小テスト', type: 'attack', power: 25, speed: 0.7, cost: 80, apCost: 2, anim:'normal', status: null, desc: '威力は低いが、当てやすい。' },
  { id: 2, name: 'チョーク投げ', type: 'attack', power: 40, speed: 1.2, cost: 150, apCost: 2, anim:'rapid', status: 'sleep', desc: '確率で敵を「居眠り」させる。' },
  { id: 8, name: 'コンパス突き', type: 'attack', power: 55, speed: 1.4, cost: 300, apCost: 3, anim:'rapid', status: null, desc: '鋭い一撃。判定が少し速い。' },
  { id: 6, name: '公式の確認', type: 'heal', power: 80, speed: 0, cost: 350, apCost: 3, anim:'magic', status: null, desc: '基本となる回復魔法。' },
  { id: 4, name: '定規ソード', type: 'attack', power: 75, speed: 1.5, cost: 500, apCost: 4, anim:'normal', status: null, desc: '長い定規で切り裂く。威力大。' },
  { id: 9, name: '分厚い教科書', type: 'attack', power: 100, speed: 0.9, cost: 800, apCost: 5, anim:'heavy', status: null, desc: '鈍器のような重み。' },
  { id: 11, name: '保健室の鍵', type: 'heal', power: 300, speed: 0, cost: 1000, apCost: 5, anim:'magic', status: null, desc: '体力を大幅に回復する。' },
  { id: 5, name: '難問の出題', type: 'attack', power: 130, speed: 2.2, cost: 1200, apCost: 6, anim:'heavy', status: 'burn', desc: '脳を焼き、「炎上」状態にする。' },
  { id: 10, name: '赤ペン連撃', type: 'attack', power: 150, speed: 1.8, cost: 1800, apCost: 7, anim:'rapid', status: 'burn', desc: '高速採点。「炎上」付与。' },
  { id: 12, name: '夏休みの宿題', type: 'attack', power: 400, speed: 3.0, cost: 3000, apCost: 9, anim:'heavy', status: null, desc: '絶望的な威力。判定は一瞬。' },
  { id: 7, name: '居残り指導', type: 'attack', power: 250, speed: 2.5, cost: 0, apCost: 8, anim:'heavy', status: 'sleep', desc: '長時間拘束。「居眠り」付与。' }
];

// アイテムデータ
export const ITEM_DB = [
    { id: 101, name: 'ブラックコーヒー', cost: 100, desc: 'APを全回復する。', type: 'ap_full' },
    { id: 102, name: '没収したマンガ', cost: 200, desc: '敵の注意を引く（100%居眠り）。', type: 'enemy_sleep' },
    { id: 103, name: '赤点答案', cost: 150, desc: '相手を精神的に燃やす（100%炎上）。', type: 'enemy_burn' }
];

// ゲームの状態変数
export let GAME_DATA = {
  gold: 0,
  stageIndex: 0,
  player: {
    name: '加藤先生', level: 1, exp: 0, nextExp: 50,
    hp: 80, maxHp: 80, atk: 1.0, 
    stress: 0, maxStress: 100,
    ap: 3, maxAp: 9,
    ownedSkillIds: [1],
    equippedSkillIds: [1],
    items: {} 
  }
};

// セーブ・ロード機能
export function saveGame() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(GAME_DATA)); } catch(e) {} }
export function loadGame() {
    try {
        const d = localStorage.getItem(SAVE_KEY);
        if(d) {
            const parsed = JSON.parse(d);
            // 既存のオブジェクトにマージ（参照を維持するため）
            Object.assign(GAME_DATA, parsed);
            if(parsed.player) Object.assign(GAME_DATA.player, parsed.player);
            if(!GAME_DATA.player.items) GAME_DATA.player.items = {};
        }
    } catch(e) {}
}
export function resetGame() { localStorage.removeItem(SAVE_KEY); location.reload(); }