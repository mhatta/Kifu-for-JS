/// <reference path="../json-kifu-format/src/player.ts" />
/// <reference path="../json-kifu-format/src/normalizer.ts" />
/// <reference path="../DefinitelyTyped/jquery/jquery.d.ts" />
/** @license
* Kifu for JS
* Copyright (c) 2014 na2hiro (https://github.com/na2hiro)
* This software is released under the MIT License.
* http://opensource.org/licenses/mit-license.php
*/
var Kifu = (function () {
    function Kifu(id) {
        this.id = id;
        this.lastTo = null;
        this.id = "#" + this.id;
    }
    Kifu.load = function (filename, id) {
        if (!id) {
            id = "kifuforjs_" + Math.random().toString(36).slice(2);
            document.write("<div id='" + id + "'></div>");
        }
        var kifu = new Kifu(id);
        kifu.prepareDOM();
        $(document).ready(function () {
            Kifu.ajax(filename, function (data) {
                kifu.filename = filename;
                kifu.initialize(JKFPlayer.parse(data, filename));
            });
        });
        return kifu;
    };
    Kifu.ajax = function (filename, onSuccess) {
        var tmp = filename.split("."), ext = tmp[tmp.length - 1];
        var encoding = ["jkf", "kifu", "ki2u"].indexOf(ext) >= 0 ? "UTF-8" : "Shift_JIS";
        $.ajax(filename, {
            success: function (data, textStatus) {
                if (textStatus == "notmodified") {
                    console.log("kifu not modified");
                    return;
                }
                onSuccess(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (textStatus != "notmodified") {
                    alert("棋譜読み込みに失敗しました: " + textStatus);
                }
            },
            beforeSend: function (xhr) {
                xhr.overrideMimeType("text/html;charset=" + encoding);
            },
            ifModified: true
        });
    };

    Kifu.prototype.initialize = function (player) {
        this.player = player;
        this.show();
    };
    Kifu.prototype.prepareDOM = function (show) {
        if (typeof show === "undefined") { show = false; }
        var _this = this;
        $(function () {
            $(_this.id).append('<table class="kifuforjs">\
			<tbody>\
				<tr>\
					<td>\
						<div class="inlineblock players">\
							<div class="mochi mochi1">\
								<div class="tebanname">☖</div>\
								<div class="mochimain"></div>\
							</div>\
							<div class="mochi">\
								<select class="kifulist" size="7"></select>\
								<ul class="lines">\
									<li><button class="dl">棋譜保存</button>\
									<li>\
										<select class="autoload">\
											<option value="0">自動更新しない\
											<option value="30">自動更新30秒毎\
											<option value="60">自動更新1分毎\
											<option value="180">自動更新3分毎\
										</select>\
									</li>\
								</ul>\
							</div>\
						</div>\
					</td>\
					<td style="text-align:center">\
						<table class="ban">\
							<tbody>\
							</tbody>\
						</table>\
					</td>\
					<td>\
						<div class="inlineblock players">\
							<div class="mochi info">\
							</div>\
							<div class="mochi mochi0">\
								<div class="tebanname">☗</div>\
								<div class="mochimain"></div>\
							</div>\
						</div>\
					</td>\
				</tr>\
				<tr>\
					<td colspan=3 style="text-align:center">\
						<ul class="inline go" style="margin:0 auto;">\
							<li><button data-go="start">|&lt;</button></li>\
							<li><button data-go="-10">&lt;&lt;</button></li>\
							<li><button data-go="-1">&lt;</button></li>\
							<li>\
								<form action="?" style="display:inline">\
									<input type="text" name="tesuu" size="3" style="text-align:center">\
								</form>\
							</li>\
							<li><button data-go="1">&gt;</button></li>\
							<li><button data-go="10">&gt;&gt;</button></li>\
							<li><button data-go="end">&gt;|</button></li>\
						</ul>\
						<ul class="inline">\
							<li><button class="credit">credit</button>\
						</ul>\
' + '\
						<textarea rows="10" class="comment" disabled></textarea>\
					</td>\
				</tr>\
			</tbody>\
		</table>');

            for (var c = 0 /* Black */; c <= 1 /* White */; c++) {
                var handDom = $("div.mochi.mochi" + c + " div.mochimain", _this.id);
                ["FU", "KY", "KE", "GI", "KI", "KA", "HI"].forEach(function (kind) {
                    var span = $("<span class='mochigoma mochi_" + kind + " mai0'></span>");
                    span.data("value", 0);
                    span.append("<img src='" + _this.getPieceImage(kind, c) + "'>");
                    span.append("<span class='maisuu'></span>");
                    span.appendTo(handDom);
                });
            }

            _this.kifulist = $("select.kifulist", _this.id);
            var that = _this;
            _this.kifulist.change(function () {
                that.goto($(this).val());
                that.refresh();
            });
            $("ul.go", _this.id).on("click", "button", function () {
                that.go($(this).attr("data-go"));
                that.refresh();
            });
            $("select.autoload", _this.id).change(function () {
                if (that.timerAutoload) {
                    clearInterval(that.timerAutoload);
                }
                var s = parseInt($(this).val());
                if (!isNaN(s) && s > 0) {
                    that.timerAutoload = setInterval(function () {
                        that.reload();
                    }, s * 1000);
                }
            });
            $("button.dl", _this.id).on("click", function () {
                if (_this.filename) {
                    window.open(_this.filename);
                }
            });
            $("button.credit", _this.id).on("click", function () {
                if (confirm("*** CREDIT ***\nKifu for JS (ver. " + Kifu.version + ")\n    by na2hiro\n    under the MIT License\n\n公式サイトを開きますか？")) {
                    window.open("https://github.com/na2hiro/Kifu-for-JS", "kifufile");
                }
            });

            /*
            $("ul.panel", this.id).on("click", "button.dl", ()=>{
            var str;
            switch($(this).attr("data-type")){
            case "json":
            str=shogi.toJSON();
            break;
            case "kif":
            str=shogi.toKIF();
            break;
            default:
            throw "未対応";
            }
            $("textarea.comment", this.id).val(str);
            });
            */
            $("ul.go form", _this.id).submit(function () {
                that.goto($("input", this).val());
                that.refresh();
                return false;
            });
            if (show)
                _this.show();
        });
    };

    //棋譜の読み込み後に吐き出す
    Kifu.prototype.show = function () {
        var _this = this;
        //		var append =[{x:"prependTo", y:"appendTo"}, {x:"appendTo", y:"appendTo"}];
        //盤面用意
        var tbody = $("table.ban tbody", this.id);
        tbody.children().remove();
        var tr = $("<tr><th></th></tr>").appendTo(tbody);
        this.tds = [];
        for (var i = 1; i <= 9; i++) {
            this.tds.push([]);

            //			$("<th>"+i+"</th>")[append[0].x](tr);
            $("<th>" + i + "</th>").prependTo(tr);
        }
        for (var j = 1; j <= 9; j++) {
            //			var tr = $("<tr></tr>")[append[0].y](tbody);
            var tr = $("<tr></tr>").appendTo(tbody);
            $("<th>" + Kifu.numToKanji(j) + "</th>").appendTo(tr);
            for (var i = 1; i <= 9; i++) {
                //				this.tds[i-1][j-1]=$("<td><img></td>")[append[0].x](tr);
                this.tds[i - 1][j - 1] = $("<td><img></td>").prependTo(tr);
            }
        }

        //棋譜用意
        var kifulist = $("select.kifulist", this.id);
        kifulist.children().remove();
        this.player.kifu.moves.forEach(function (obj, tesuu) {
            $("<option value='" + tesuu + "'>" + (_this.player.getComments(tesuu).length > 0 ? "*" : "&nbsp;") + Kifu.pad(tesuu.toString(), "&nbsp;", 3) + " " + _this.player.getReadableKifu(tesuu) + "</option>").appendTo(kifulist);
            i++;
        });

        var data = this.player.kifu.header;
        var dl = $("<dl></dl>");
        for (var key in data) {
            switch (key) {
                case "先手":
                case "後手":
                    this.setPlayer(key == "先手" ? 0 : 1, data[key]);

                default:
                    dl.append($("<dt></dt>").text(key));
                    dl.append($("<dd></dd>").text(data[key]));
            }
        }
        var dom = $("div.info", this.id);
        dom.children().remove();
        dom.append(dl);

        this.refresh();
    };

    //盤面を再生した後に吐き出す
    Kifu.prototype.refresh = function () {
        for (var i = 1; i <= 9; i++) {
            for (var j = 1; j <= 9; j++) {
                this.setPiece(i, j, this.player.getBoard(i, j));
            }
        }

        for (var color = 0 /* Black */; color <= 1 /* White */; color++) {
            var obj = this.player.getHandsSummary(color);
            for (var kind in obj) {
                this.setHand(color, kind, obj[kind]);
            }
        }

        //手数描画
        $("ul.go form input", this.id).val(this.player.tesuu.toString());
        try  {
            $("select.kifulist option", this.id)[this.player.tesuu].selected = true;
        } catch (e) {
        }
        ;

        //最終手描画戻す
        if (this.lastTo) {
            this.tds[this.lastTo.x - 1][this.lastTo.y - 1].removeClass("lastto");
            this.lastTo = null;
        }

        var nowComments = this.player.getComments();
        var nowMove = this.player.getMove();
        if (this.player.tesuu == this.player.kifu.moves.length - 1) {
            //最終手に動きがない(≒specialである)場合は直前の一手を採用
            if (nowComments.length == 0)
                nowComments = this.player.getComments(this.player.tesuu - 1);
            if (!nowMove)
                nowMove = this.player.getMove(this.player.tesuu - 1);
        }

        //コメント描画
        $("textarea.comment", this.id).val(nowComments.join("\n"));

        //最終手描画
        if (nowMove && nowMove.to) {
            this.lastTo = nowMove.to;
            this.tds[this.lastTo.x - 1][this.lastTo.y - 1].addClass("lastto");
        }
    };
    Kifu.prototype.setPiece = function (x, y, piece) {
        var dom = $("img", this.tds[x - 1][y - 1]);
        var src = this.getPieceImageByPiece(piece);
        if (dom.attr("src") != src) {
            dom.attr("src", src);
        }
    };
    Kifu.prototype.getHandDom = function (color, kind) {
        return $("div.mochi.mochi" + color + " div.mochimain span.mochigoma.mochi_" + kind, this.id);
    };
    Kifu.prototype.setHand = function (color, kind, value) {
        var dom = this.getHandDom(color, kind);
        var val = dom.data("value");
        if (val == value)
            return;
        dom.data("value", value);
        if (value < 2) {
            dom.removeClass("mai" + (1 - value));
            dom.addClass("mai" + value);
        } else {
            $("span.maisuu", dom).text(Kifu.numToKanji(value));
            dom.removeClass("mai0 mai1");
        }
    };
    Kifu.prototype.getPieceImageByPiece = function (piece) {
        return piece ? this.getPieceImage(piece.kind, piece.color) : this.getPieceImage(null, null);
    };
    Kifu.prototype.getPieceImage = function (kind, color) {
        return Kifu.settings["ImageDirectoryPath"] + "/" + (!kind ? "blank" : color + kind) + ".png";
    };
    Kifu.prototype.goto = function (tesuu) {
        if (isNaN(tesuu))
            return;
        this.player.goto(tesuu);
    };
    Kifu.prototype.go = function (tesuu) {
        if (tesuu == "start") {
            this.player.goto(0);
        } else if (tesuu == "end") {
            this.player.goto(Infinity);
        } else {
            tesuu = parseInt(tesuu);
            if (isNaN(tesuu))
                return;
            this.player.go(tesuu);
        }
    };
    Kifu.prototype.setPlayer = function (color, name) {
        $("div.mochi.mochi" + color + " .tebanname", this.id).text(Kifu.colorToMark(color) + name);
    };
    Kifu.prototype.reload = function () {
        var _this = this;
        Kifu.ajax(this.filename, function (data) {
            JKFPlayer.log("reload");
            var tesuu = _this.player.tesuu == _this.player.kifu.moves.length - 1 ? Infinity : _this.player.tesuu;
            var player = JKFPlayer.parse(data, _this.filename);
            player.goto(tesuu);
            _this.initialize(player);
        });
    };

    Kifu.numToKanji = function (n) {
        return "〇一二三四五六七八九"[n];
    };
    Kifu.colorToMark = function (color) {
        return color == 0 /* Black */ ? "☗" : "☖";
    };

    // length <= 10
    Kifu.pad = function (str, space, length) {
        var ret = "";
        for (var i = str.length; i < length; i++) {
            ret += space;
        }
        return ret + str;
    };
    Kifu.version = "1.0.5";
    Kifu.settings = {};
    return Kifu;
})();
