/*==========================================================================
 NLM_ActorNameColor.js
----------------------------------------------------------------------------
 (C)2026 NoLimits
 This software is released under the MIT License.
 http://opensource.org/licenses/mit-license.php
----------------------------------------------------------------------------
 Version
 1.0.0  2026/11/07 初稿
 1.0.1  2026/11/13 パラメータのスクリプト条件式の凡例に「TPが100時」を追加
============================================================================*/

/*:
 * @target MZ MV
 * @plugindesc アクター名色変更プラグイン（v1.0.1）
 * @author ノリミツ (NoLimits)
 * @url https://github.com/nolimits-tukool
 * 
 * @param list
 * @text 条件と色設定リスト
 * @desc 条件と色を設定（上から順に判定され、条件を満たすと色が変更されるので、それより下の条件式は無効になる点に注意）
 * @type struct<List>[]
 * @default ["{\"Cond\":\"a.tp === 100; // アクターのTPが100の時\",\"Color\":\"27\"}","{\"Cond\":\"a.isStateAffected(4); // ステートID:4にかかっている時\",\"Color\":\"24\"}","{\"Cond\":\"a._level >= 50; // アクターのレベルが50以上の時\",\"Color\":\"17\"}","{\"Cond\":\"a._classId === 1; // アクターの職業IDが1の時\",\"Color\":\"2\"}"]
 * 
 * @param defaultHp
 * @text デフォルトHP仕様
 * @desc デフォルトのHPカラー仕様（死亡時、最大HPの1/4時）を優先判定するか（OFF時はデフォルトHPカラーが判定されません）
 * @type boolean
 * @default true
 * 
 * @param mzBattleStatus
 * @text MZ戦闘ステータス適用
 * @desc MZの戦闘ステータスでも適用するか（デフォルト：ON）　　　　（MVでは戦闘時も常時適用になる）
 * @type boolean
 * @default true
 * 
 * 
 * @help
 * 
 * 【RPGツクールMZ/MV両用プラグイン】
 * 　メニュー/戦闘画面のアクター名の色をパラメータで設定したスクリプト条件式に
 * より変更することができます
 * 
 * 　パラメータ「条件と色設定リスト」は上から順に判定され、条件を満たすと色が変更
 * されるので、それより下の条件式が無効になります
 * 　優先度の高い条件式は、なるべく上に配置するようにして下さい
 * 　リストは右クリックで「削除」「コピー」のほか、ドラッグ＆ドロップも可能です
 * 
 * プラグインコマンドはありません
 * 利用規約はMITライセンスの通りです
 */

/*~struct~List:
 * @param Cond
 * @text スクリプト条件式
 * @desc スクリプト条件式（アクターを a. 変数をv[]で参照できます）（空欄だとtrueとみなされるので注意）
 * @type combo
 * @option a.isDead(); // アクターが戦闘不能時
 * @option a.tp === 100; // アクターのTPが100の時
 * @option a.isStateAffected(4); // ステートID:4にかかっている時
 * @option a.hp < a.mhp / 4; // HPが最大HPの1/4より低い時
 * @option v[10] === 2; // 変数ID:10の値が2の時
 * @option a._level >= 50; // アクターのレベルが50以上の時
 * @option a._classId === 1; // アクターの職業IDが1の時
 * @option a._actorId === 3; // アクターIDが3の時
 *
 * @param Color
 * @text 変更色
 * @desc 変更される色(0-31)
 * @type color
 * @default 0
 */

(() => {
    "use strict";

    const pluginName = "NLM_ActorNameColor";
    const NANCparam  = PluginManager.parameters(pluginName);

    const NANCmz = Utils.RPGMAKER_NAME === "MZ";
    let NANClist = [];

// Scene_Boot関係（起動時パラメータ読み込み）
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.apply(this, arguments);
        NANClist = this.NANCstruct(NANCparam.list);
    };

    Scene_Boot.prototype.NANCstruct = function(param) {
        if (!param.length) return [];
        const str = JSON.parse(param);
        return str.map(str => JSON.parse(str));
    };

// Window_Base関係（メイン処理）
    Window_Base.prototype.drawActorName = function(actor, x, y, width) {
        width = width || 168;
        this.contents.textColor = this.NANCcolor(actor); // 変更
        this.drawText(actor.name(), x, y, width);
    };

    Window_Base.prototype.NANCcolor = function(actor) {
        const nColor = NANCmz ? ColorManager.normalColor()  : this.normalColor();
        const dColor = NANCmz ? ColorManager.hpColor(actor) : this.hpColor(actor);
        if (!actor) return nColor;
        if (NANCparam.defaultHp === "true" && dColor !== nColor) {
            return dColor;
        }
        for (const list of NANClist) {
            if (this.NANCevalFormula(list.Cond, actor)) {
            return NANCmz ? ColorManager.textColor(list.Color)
                : this.textColor(list.Color);
            }
        }
        return nColor;
    };

    Window_Base.prototype.NANCevalFormula = function(formula, a) {
        if (!formula) return true;
        try {
            const v = $gameVariables._data; // 変数値に置き換え
            const V = $gameVariables._data;
            return eval(formula);
        } catch (e) {
            return false;
        }
    }; // 条件判定

// MZの出力関係
    if (NANCmz) {
        Window_StatusBase.prototype.drawActorName = function(actor, x, y, width) {
            width = width || 168;
            this.contents.textColor = this.NANCcolor(actor); // 変更
            this.drawText(actor.name(), x, y, width);
        };

        if (NANCparam.mzBattleStatus === "true") {
            Sprite_Name.prototype.textColor = function() {
                return Window_Base.prototype.NANCcolor(this._battler);
            }; // MZの戦闘ステータスでも適用
        }
    }
})();
