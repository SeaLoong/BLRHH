// ==UserScript==
// @name         Bilibili直播间挂机助手
// @namespace    SeaLoong
// @version      1.8.3
// @description  Bilibili直播间自动签到，领瓜子，参加抽奖，完成任务，送礼等
// @author       SeaLoong
// @homepageURL  https://github.com/SeaLoong/Bilibili-LRHH
// @supportURL   https://github.com/SeaLoong/Bilibili-LRHH/issues
// @updateURL    https://raw.githubusercontent.com/SeaLoong/Bilibili-LRHH/master/Bilibili%E7%9B%B4%E6%92%AD%E9%97%B4%E6%8C%82%E6%9C%BA%E5%8A%A9%E6%89%8B.js
// @include      /https?:\/\/live\.bilibili\.com\/\d+/
// @require      https://greasyfork.org/scripts/38140-bilibili-api/code/Bilibili-API.js
// @require      https://greasyfork.org/scripts/44866-ocrad/code/OCRAD.js
// @grant        none
// @run-at       document-end
// @license      MIT License
// ==/UserScript==

(function() {
    'use strict';

    // <-!!!请注意，修改此处设置将不会再生效，请点击页面右下角的"挂机助手设置"打开设置界面进行设置!!!->
    var CONFIG = {
        USE_SIGN: true, // 自动签到
        USE_AWARD: true, // 自动领取瓜子
        USE_LOTTERY: false, // 自动参加抽奖
        LOTTERY_CONFIG: {
            ALLOW_NOT_SHORT_ROOMID: true, // 允许在非短ID直播间进行抽奖
            AGENT_ROOMID: 2 // 代理抽奖直播间ID，必须为短ID直播间，否则无法正常抽奖(用于绕过B站限制，最好选择长期无人直播间，默认为2号直播间)
        },
        USE_TASK: true, // 自动完成任务
        USE_GIFT: false, // 自动送礼物
        GIFT_CONFIG: { // 若启用自动送礼物，则需要设置以下项
            SHORT_ROOMID: 0, // 送礼物的直播间ID(即地址中live.bilibili.com/后面的数字), 设置为0则表示自动检查当前主播勋章
            CHANGE_MEDAL: false, // 设置是否允许 当有当前主播勋章，且当前佩戴的勋章不是当前主播勋章时自动切换为当前主播勋章
            SEND_GIFT: ['1'], // 设置默认送的礼物类型编号(见下方列表/点击问号)，多个请用英文逗号(,)隔开，为空则表示默认不送出礼物
            ALLOW_GIFT: ['1', '4', '6'], // 设置允许送的礼物类型编号(见下方列表/点击问号)(!!任何未在此列表的礼物一定不会被送出!!)，多个请用英文逗号(,)隔开，为空则表示允许送出所有类型的礼物
            SEND_TODAY: false // 送出包裹中今天到期的礼物(!会送出SEND_GIFT之外的礼物!若今日亲密度已满则不送)
        },
        SHOW_TOAST: true, // 显示浮动提示
        EXCHANGE_SILVER2COIN: false // 消耗700银瓜子兑换1个硬币
    };
    // <-!!!请注意，修改此处设置将不会再生效，请点击页面右下角的"挂机助手设置"打开设置界面进行设置!!!->

    /* 礼物编号及对应礼物、亲密度对照表
    (有些数据暂时不清楚，如有知道的可以告诉我，目前采用的亲密度计算方法是:礼物亲密度=向上取整(礼物价值瓜子数/100))
    1:辣条：亲密度+1
    3:B坷垃：亲密度+99
    4:喵娘：亲密度+52
    6:亿元：亲密度+10
    7:666：亲密度+?
    8:233：亲密度+?
    25:小电视：亲密度+12450?
    39:节奏风暴：亲密度+1000?
    105:火力票：亲密度+20
    106:哔哩星：亲密度+20
    109:红灯笼：亲密度+20
    110:小爆竹：亲密度+20
    */

    /* 此行以下内容请勿修改，当然你要改那我也没办法 */

    var DEBUGMODE = false;
    var DEBUG = function(sign, data) {
        if (!DEBUGMODE) return;
        var d = new Date();
        d = '[' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '.' + d.getMilliseconds() + ']';
        console.debug(d, sign + ':', data);
    };
    var CONFIG_DEFAULT = {
        USE_SIGN: true,
        USE_AWARD: true,
        USE_LOTTERY: false,
        LOTTERY_CONFIG: {
            ALLOW_NOT_SHORT_ROOMID: true,
            AGENT_ROOMID: 2
        },
        USE_TASK: true,
        USE_GIFT: false,
        GIFT_CONFIG: {
            SHORT_ROOMID: 0,
            CHANGE_MEDAL: false,
            SEND_GIFT: ['1'],
            ALLOW_GIFT: ['1', '4', '6'],
            SEND_TODAY: false
        },
        SHOW_TOAST: true,
        EXCHANGE_SILVER2COIN: false
    };
    var CONFIG_NAME_LIST = {
        USE_SIGN: '自动签到',
        USE_AWARD: '自动领取瓜子',
        USE_LOTTERY: '自动参加抽奖',
        LOTTERY_CONFIG: '抽奖设置',
        ALLOW_NOT_SHORT_ROOMID: '允许在任意直播间抽奖',
        AGENT_ROOMID: '代理抽奖直播间ID',
        USE_TASK: '自动完成任务',
        USE_GIFT: '自动送礼物',
        GIFT_CONFIG: '送礼设置',
        SHORT_ROOMID: '房间号',
        SEND_GIFT: '默认礼物类型',
        ALLOW_GIFT: '允许礼物类型',
        CHANGE_MEDAL: '允许切换勋章',
        SEND_TODAY: '送出包裹中今天到期的礼物',
        SHOW_TOAST: '显示浮动提示',
        EXCHANGE_SILVER2COIN: '银瓜子换硬币'
    };
    var CONFIG_PLACEHOLDER_LIST = {
        AGENT_ROOMID: '房间号(必须为短ID,默认为2)',
        SHORT_ROOMID: '为0则自动检测勋章',
        SEND_GIFT: "为空则默认不送",
        ALLOW_GIFT: '为空则允许所有'
    };
    var CONFIG_HELP_LIST = {
        USE_LOTTERY: '设置是否自动参加抽奖功能，包括小电视抽奖、活动(即B站当前进行的活动)抽奖<br>注意：有封号风险，已尝试规避',
        ALLOW_NOT_SHORT_ROOMID: function() {
            return '允许在任意直播间进行抽奖(实际上是挂在 ' + CONFIG.LOTTERY_CONFIG.AGENT_ROOMID + ' 号直播间参加抽奖)<br>注意：会消耗更多的系统资源';
        },
        AGENT_ROOMID: function() {
            return '代理抽奖直播间ID，必须为短ID直播间，否则无法正常抽奖(用于绕过B站限制，最好选择长期无人直播间，默认为2号直播间)<br>当前设置为 ' + CONFIG.LOTTERY_CONFIG.AGENT_ROOMID;
        },
        SHORT_ROOMID: '送礼物的直播间ID(即地址中live.bilibili.com/后面的数字), 设置为0则表示自动检查当前主播勋章',
        CHANGE_MEDAL: '设置是否允许“当有当前主播勋章，且当前佩戴的勋章不是当前主播勋章时自动切换为当前主播勋章”',
        SEND_GIFT: function() {
            var s = '设置默认送的礼物类型编号，多个请用英文逗号(,)隔开，为空则表示默认不送出礼物';
            return s + '<br><br>' + gift_list_str;
        },
        ALLOW_GIFT: function() {
            var s = '设置允许送的礼物类型编号(任何未在此列表的礼物一定不会被送出!)，多个请用英文逗号(,)隔开，为空则表示允许送出所有类型的礼物';
            return s + '<br><br>' + gift_list_str;
        },
        SEND_TODAY: '送出包裹中今天到期的礼物(会送出"默认礼物类型"之外的礼物，若今日亲密度已满则不送)',
        EXCHANGE_SILVER2COIN: '消耗700银瓜子兑换1个硬币(每天只能兑换一次)'
    };
    var CONFIG_CONTROL_LIST = {
        USE_GIFT: 'GIFT_CONFIG',
        USE_LOTTERY: 'LOTTERY_CONFIG'
    };
    var NAME = 'Bilibili-LiveRoom-HangHelper';
    var API = null;
    var Toast = {
        element: null,
        list: [],
        count: 0
    };
    var DOM = {
        treasure: {
            div: null,
            image: null,
            canvas: null,
            div_tip: null,
            div_timer: null
        },
        storm: {
            div: null,
            image: null,
            canvas: null
        },
        config: {
            is_showed: false,
            div_button: null,
            div_button_span: null,
            div_side_bar: null,
            div_position: null,
            div_style: null,
            div_title: null,
            div_title_span: null,
            div_title_button: null,
            div_button_reset: null,
            div_context_position: null,
            div_context: null
        },
        alertdialog: {
            div_background: null,
            div_position: null,
            div_style: null,
            div_title: null,
            div_title_span: null,
            div_content: null,
            div_button: null,
            button_ok: null
        },
        lottery: {
            iframe: null
        }
    };
    var gift_list;
    var gift_list_str = '礼物编号及对应礼物、亲密度对照表<br>';
    var Info = {
        short_id: null,
        uid: null,
        ruid: null,
        roomid: null,
        rnd: null,
        area_id: null, // area_v2_id
        area_parent_id: null,
        old_area_id: null, // areaId
        csrf_token: function() {
            return getCookie('bili_jct');
        },
        today_feed: null,
        day_limit: null,
        silver: null,
        gold: null,
        mobile_verified: null,
        medal_list: null,
        medal_target_id: null,
        task_list: null,
        bag_list: null,
        visit_id: null
    };

    function ts_s() {
        return Math.floor(Date.now() / 1000);
    }

    function ts_ms() {
        return Date.now();
    }

    function getCookie(name) {
        var arr, reg = new RegExp('(^| )' + name + '=([^;]*)(;|$)');
        if ((arr = document.cookie.match(reg))) {
            return unescape(arr[2]);
        } else {
            return null;
        }
    }

    function setCookie(name, value, seconds) {
        seconds = seconds || 0;
        var expires = '';
        if (parseInt(seconds, 10) !== 0) {
            var date = new Date();
            date.setTime(date.getTime() + (seconds * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + escape(value) + expires + '; path=/';
    }

    function solveCaptcha() {
        // 识别节奏风暴验证码(未实现)，由于OCRAD识别准确度太低，所以使用到这个函数的功能都没有启用
        // 如果会做验证码的识别可以自己在这里实现
        /*
        var ctx = DOM.storm.canvas[0].getContext('2d');
        ctx.drawImage(DOM.storm.image[0], 0, 0, 112, 32);
        return OCRAD(ctx.getImageData(0, 0, 112, 32));
        */
        return null;
    }

    function giftIDtoFeed(gift_id) {
        for (var i = gift_list.length - 1; i >= 0; i--) {
            if (gift_list[i].id == gift_id) {
                return Math.ceil(gift_list[i].price / 100);
            }
        }
        return null;
    }

    window.room_id_list = [];

    window.toast = function(e, n, r) {
        var t = Toast.element;
        if (!CONFIG.SHOW_TOAST || !t) return;
        if ('boolean' === typeof n) n = 'info';
        var o = document.createDocumentFragment(),
            a = document.createElement('div');
        if ('success' !== (n = n || 'info') && 'caution' !== n && 'error' !== n && 'info' !== n)
            throw new Error(i + ' 在使用 Link Toast 时必须指定正确的类型: success || caution || error || info');
        if (a.innerHTML = '<span class="toast-text">' + e + '</span>',
            a.className = 'link-toast ' + n + ' ' + (r ? 'fixed' : ''), !t.className && !t.attributes)
            throw new Error(i + ' 传入 element 不是有效节点.');
        var c = t.getBoundingClientRect(),
            s = c.left,
            u = c.top,
            l = c.width,
            f = c.height,
            p = document.documentElement && document.documentElement.scrollLeft || document.body.scrollLeft;
        // a.style.left = s + l + p + 'px';
        a.style.left = s + p + 'px';
        var d = document.documentElement && document.documentElement.scrollTop || document.body.scrollTop;
        // a.style.top = u + f + d + Toast.count * 40 + 'px';
        a.style.top = u + d + Toast.count * 40 + 'px';
        setTimeout((function() {
            a.className += ' out';
            setTimeout((function() {
                Toast.count--;
                Toast.list.unshift();
                Toast.list.forEach(function(v) {
                    v.style.top = (parseInt(v.style.top, 10) - 40) + 'px';
                });
                a.parentNode.removeChild(a);
            }), 200);
        }), 4e3);
        o.appendChild(a);
        document.body.appendChild(o);
        var h = document.body.offsetWidth,
            v = a.getBoundingClientRect().left,
            m = a.offsetWidth;
        if (h - m - v < 0) a.style.left = h - m - 10 + p + 'px';
        Toast.count++;
        Toast.list.push(a);
    };

    window.Lottery_join = function(i, short_id) {
        setTimeout(function() {
            if (short_id > 0) {
                $.get('//live.bilibili.com/' + short_id + '?visit_id=' + Info.visit_id); // 模拟访问房间，visit_id不确定是否与抽奖封号有关
                var room_id = window.room_id_list[short_id];
                if (room_id > 0) {
                    SmallTV.init(room_id);
                    Raffle.init(room_id);
                    ZongDu.init(room_id);
                    // Storm.init(room_id);
                } else {
                    API.room.room_init(short_id).done(function(response) {
                        DEBUG('window.Lottery_join: room_init', response);
                        if (response.code === 0) {
                            room_id = response.data.room_id;
                            if (response.data.encrypted || response.data.is_hidden || response.data.is_locked || response.data.pwd_verified) {
                                toast('[自动抽奖]疑似钓鱼直播间【' + room_id + '】，不参加该直播间的抽奖', 'caution');
                            } else {
                                if (response.data.short_id > 0 && response.data.short_id != short_id) window.room_id_list[response.data.short_id] = room_id;
                                window.room_id_list[short_id] = room_id;
                                SmallTV.init(room_id);
                                Raffle.init(room_id);
                                ZongDu.init(room_id);
                                // Storm.init(room_id);
                            }
                        }
                    });
                }
            }
        }, i * 100);
    };

    function alertDialog(title, content) {
        DOM.alertdialog.div_title_span.html(title);
        DOM.alertdialog.div_content.html(content);
        DOM.alertdialog.button_ok.click(function() {
            $('#' + NAME + '_alertdialog').remove();
        });
        $('body > .link-popup-ctnr').append(DOM.alertdialog.div_background);
    }

    function execUntilSucceed(callback, delay, period) {
        setTimeout(function() {
            if (!callback()) {
                var p = period < 1 ? 200 : period;
                execUntilSucceed(callback, p, p);
            }
        }, delay < 1 ? 1 : delay);
    }

    function tommorrowRun(callback) {
        var t = new Date();
        do {
            t.setHours(t.getHours() + 1);
        } while (t.getHours() !== 0);
        setTimeout(callback, t.valueOf() - Date.now());
    }

    function removeBlankChar(str) {
        return str.replace(/(\s|\u00A0)+/, '');
    }

    function addCSS(context) {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = context;
        document.getElementsByTagName('head')[0].appendChild(style);
    }

    function recurLoadConfig(cfg) {
        for (var item in cfg) {
            var e = $('#' + NAME + '_config_' + item);
            if (e[0]) {
                switch (typeof cfg[item]) {
                    case 'string':
                    case 'number':
                        e.val(cfg[item]);
                        break;
                    case 'boolean':
                        e.prop('checked', cfg[item]);
                        if (e.is(':checked')) {
                            $('#' + NAME + '_config_' + CONFIG_CONTROL_LIST[DOMtoItem(e)]).show();
                        } else {
                            $('#' + NAME + '_config_' + CONFIG_CONTROL_LIST[DOMtoItem(e)]).hide();
                        }
                        break;
                    case 'object':
                        if (Array.isArray(cfg[item])) e.val(cfg[item].join(','));
                        else recurLoadConfig(cfg[item]);
                        break;
                }
            }
        }
    }

    function recurSaveConfig(config) {
        var cfg = JSON.parse(JSON.stringify(config || CONFIG_DEFAULT));
        if (typeof cfg !== 'object') return cfg;
        for (var item in cfg) {
            var e = $('#' + NAME + '_config_' + item);
            if (e[0]) {
                switch (typeof cfg[item]) {
                    case 'string':
                        cfg[item] = e.val() || '';
                        break;
                    case 'number':
                        cfg[item] = parseInt(e.val(), 10) || 0;
                        break;
                    case 'boolean':
                        cfg[item] = e.is(':checked');
                        break;
                    case 'object':
                        if (Array.isArray(cfg[item])) {
                            if (removeBlankChar(e.val()) === '') {
                                cfg[item] = [];
                            } else {
                                cfg[item] = removeBlankChar(e.val()).split(',');
                            }
                        } else {
                            cfg[item] = recurSaveConfig(cfg[item]);
                        }
                        break;
                }
            }
        }
        return cfg;
    }

    function loadConfig() {
        try {
            CONFIG = JSON.parse(localStorage.getItem(NAME + '_CONFIG')) || JSON.parse(JSON.stringify(CONFIG_DEFAULT));
            if (typeof CONFIG !== 'object') {
                CONFIG = JSON.parse(JSON.stringify(CONFIG_DEFAULT));
                localStorage.setItem(NAME + '_CONFIG', JSON.stringify(CONFIG));
            }
        } catch (e) {
            console.info('Bilibili直播间挂机助手读取配置失败');
            // localStorage.removeItem(NAME + '_CONFIG');
            // localStorage.removeItem('Bilibili-LiveRoom-HangHelper_CONFIG');
            CONFIG = JSON.parse(JSON.stringify(CONFIG_DEFAULT));
            localStorage.setItem(NAME + '_CONFIG', JSON.stringify(CONFIG));
        }
        DEBUG('loadConfig: CONFIG', CONFIG);
        if (DOM.config.div_context) {
            recurLoadConfig(CONFIG);
        }
    }

    function saveConfig() {
        if (DOM.config.div_context) {
            CONFIG = recurSaveConfig(CONFIG_DEFAULT);
        }
        localStorage.setItem(NAME + '_CONFIG', JSON.stringify(CONFIG));
        // DEBUG('saveConfig: CONFIG', CONFIG);
    }

    function DOMtoItem(element) {
        return element.attr('id').replace(NAME + '_config_', '');
    }

    function DOMhelptoItem(element) {
        return element.attr('id').replace(NAME + '_config_help_', '');
    }
    /*
    window.BilibiliLive.ANCHOR_UID
    window.BilibiliLive.COLORFUL_LOGGER
    window.BilibiliLive.INIT_TIME
    window.BilibiliLive.RND === window.DANMU_RND
    window.BilibiliLive.ROOMID
    window.BilibiliLive.SHORT_ROOMID
    window.BilibiliLive.UID
    window.captcha_key
    window.$b
    */
    function Init() {
        try {
            try {
                API = BilibiliAPI;
            } catch (err) {
                toast('BilibiliAPI初始化失败，脚本已停用！', 'error');
                console.error('BilibiliAPI初始化失败，脚本已停用！');
                console.error(err);
                return;
            }
            if (window.frameElement) {
                console.info('Bilibili直播间挂机助手: 已启用任意直播间抽奖，初始化子脚本！');
                DEBUG('Init: window.frameElement', window.frameElement);
                execUntilSucceed(function() {
                    if (window.BilibiliLive && parseInt(window.BilibiliLive.ROOMID, 10) !== 0) {
                        if (parseInt(window.BilibiliLive.UID, 10) !== 0) {
                            Info.short_id = window.BilibiliLive.SHORT_ROOMID;
                            Info.uid = window.BilibiliLive.UID;
                            Info.roomid = window.BilibiliLive.ROOMID;
                            Info.ruid = window.BilibiliLive.ANCHOR_UID;
                            Info.rnd = window.BilibiliLive.RND;
                            window.toast = window.top.toast;
                            window.room_id_list = window.top.room_id_list;
                            window.parent.Lottery_join = window.Lottery_join;
                            window.parent.Lottery_inited = true;
                            DOM.storm.div = $('<div id="' + NAME + '_storm_div" style="display:none"></div>');
                            DOM.storm.image = $('<img id="' + NAME + '_storm_image" style="display:none">');
                            DOM.storm.canvas = $('<canvas id="' + NAME + '_storm_canvas" style="display:none"></canvas>');
                            DOM.storm.div.append(DOM.storm.image);
                            DOM.storm.div.append(DOM.storm.canvas);
                            document.body.appendChild(DOM.storm.div[0]);
                            DEBUG('Iframe: Init: Info', Info);
                            execUntilSucceed(function() {
                                if ($('.live-room-app.p-relative')[0]) {
                                    document.getElementsByTagName('head')[0].innerHTML = '';
                                    $('.live-room-app.p-relative').remove();
                                    return true;
                                }
                            }, 9e3, 3e3);
                        }
                        return true;
                    }
                }, 1, 500);
                return;
            }
            console.info('Bilibili直播间挂机助手: 已加载');
            InitAlertDialogGui();
            InitConfigGui();
            loadConfig();
            saveConfig();
            execUntilSucceed(function() {
                DEBUG('Init: BilibiliLive', window.BilibiliLive);
                if (window.BilibiliLive && parseInt(window.BilibiliLive.ROOMID, 10) !== 0) {
                    if (parseInt(window.BilibiliLive.UID, 10) !== 0) {
                        Info.short_id = window.BilibiliLive.SHORT_ROOMID;
                        Info.uid = window.BilibiliLive.UID;
                        Info.roomid = window.BilibiliLive.ROOMID;
                        Info.ruid = window.BilibiliLive.ANCHOR_UID;
                        Info.rnd = window.BilibiliLive.RND;
                        Info.visit_id = window.__statisObserver.__visitId;
                        window.room_id_list[Info.short_id] = Info.roomid;
                        if (CONFIG.USE_AWARD) {
                            execUntilSucceed(function() {
                                var _treasure_box = $('#gift-control-vm div.treasure-box.p-relative');
                                if (_treasure_box[0]) {
                                    _treasure_box.attr('id', 'old_treasure_box');
                                    _treasure_box.hide();
                                    DOM.treasure.div = $('<div id="' + NAME + '_treasure_div" class="treasure-box p-relative"></div>');
                                    DOM.treasure.div_tip = $('<div id="' + NAME + '_treasure_div_tip" class="t-center b-box none-select">自动<br>领取中</div>');
                                    DOM.treasure.div_timer = $('<div id="' + NAME + '_treasure_div_timer" class="t-center b-box none-select">0</div>');
                                    DOM.treasure.image = $('<img id="' + NAME + '_treasure_image" style="display:none">');
                                    DOM.treasure.canvas = $('<canvas id="' + NAME + '_treasure_canvas" style="display:none" height="40" width="120"></canvas>');
                                    var css_text = 'max-width: 40px;padding: 2px 3px;margin-top: 3px;font-size: 12px;color: #fff;background-color: rgba(0,0,0,.5);border-radius: 10px;';
                                    DOM.treasure.div_tip[0].style = css_text;
                                    DOM.treasure.div_timer[0].style = css_text;
                                    DOM.treasure.div.append(DOM.treasure.div_tip);
                                    DOM.treasure.div.append(DOM.treasure.image);
                                    DOM.treasure.div.append(DOM.treasure.canvas);
                                    DOM.treasure.div_tip.after(DOM.treasure.div_timer);
                                    _treasure_box.after(DOM.treasure.div);
                                    TaskAward.treasure_timer = setInterval(function() {
                                        var t = parseInt(DOM.treasure.div_timer.text(), 10);
                                        if (t > 0) DOM.treasure.div_timer.text((t - 1) + 's');
                                        else DOM.treasure.div_timer.hide();
                                    }, 1e3);
                                    return true;
                                }
                            });
                        }
                        if (CONFIG.USE_LOTTERY) {
                            if (CONFIG.LOTTERY_CONFIG.ALLOW_NOT_SHORT_ROOMID && Info.roomid === Info.short_id) {
                                // 非短号直播间
                                window.Lottery_inited = false;
                                DOM.lottery.iframe = $('<iframe name="' + NAME + '_iframe"></iframe>');
                                if (!CONFIG.LOTTERY_CONFIG.AGENT_ROOMID) CONFIG.LOTTERY_CONFIG.AGENT_ROOMID = 2;
                                DOM.lottery.iframe[0].src = '//live.bilibili.com/' + CONFIG.LOTTERY_CONFIG.AGENT_ROOMID;
                                document.body.appendChild(DOM.lottery.iframe[0]);
                                DEBUG('Init: lottery_iframe_window', window.frames[NAME + '_iframe']);
                            } else {
                                window.Lottery_inited = true;
                                DOM.storm.div = $('<div id="' + NAME + '_storm_div" style="display:none"></div>');
                                DOM.storm.image = $('<img id="' + NAME + '_storm_image" style="display:none">');
                                DOM.storm.canvas = $('<canvas id="' + NAME + '_storm_canvas" style="display:none"></canvas>');
                                DOM.storm.div.append(DOM.storm.image);
                                DOM.storm.div.append(DOM.storm.canvas);
                                document.body.appendChild(DOM.storm.div[0]);
                            }
                        }
                        if (CONFIG.USE_GIFT && (CONFIG.GIFT_CONFIG.SHORT_ROOMID === 0 || CONFIG.GIFT_CONFIG.SHORT_ROOMID === Info.short_id)) {
                            API.live_user.get_weared_medal(Info.uid, Info.roomid, Info.csrf_token).done(function(response) {
                                DEBUG('Init: get_weared_medal', response);
                                if (response.code === 0) {
                                    Info.medal_target_id = response.data.target_id;
                                    Info.today_feed = parseInt(response.data.today_feed, 10);
                                    Info.day_limit = response.data.day_limit;
                                    Info.old_area_id = response.data.area;
                                    Info.area_id = response.data.area_v2_id;
                                    Info.area_parent_id = response.data.area_v2_parent_id;
                                    API.gift.room_gift_list(Info.roomid, Info.area_id).done(function(response) {
                                        DEBUG('Init: room_gift_list', response);
                                        if (response.code === 0) {
                                            gift_list = response.data;
                                            gift_list.forEach(function(v) {
                                                gift_list_str += v.id + '：' + v.name + '，亲密度+' + Math.ceil(v.price / 100) + '<br>';
                                            });
                                        }
                                        DEBUG('gift_list_str', gift_list_str);
                                    });
                                }
                            });
                            API.live_user.get_info_in_room(Info.roomid).done(function(response) {
                                DEBUG('Init: get_info_in_room', response);
                                if (response.code === 0) {
                                    Info.silver = response.data.wallet.silver;
                                    Info.gold = response.data.wallet.gold;
                                    Info.mobile_verified = response.data.info.mobile_verified;
                                }
                            });
                        }
                        setTimeout(function() {
                            DEBUG('Init: Info', Info);
                            Toast.element = $('<div id="' + NAME + '_div_toast"></div>');
                            Toast.element.appendTo($('#rank-list-vm'));
                            Toast.element = Toast.element[0];
                            var str = [];
                            if (CONFIG.USE_SIGN) str.push('自动签到');
                            if (CONFIG.USE_AWARD) str.push('自动领取瓜子');
                            if (CONFIG.USE_LOTTERY) str.push('自动参加抽奖');
                            if (CONFIG.USE_TASK) str.push('自动完成任务');
                            if (CONFIG.USE_GIFT) str.push('自动送礼');
                            if (CONFIG.EXCHANGE_SILVER2COIN) str.push('银瓜子换硬币');
                            if (str.length) str = str.join('，');
                            else str = '无';
                            toast('助手已启用功能：' + str, 'info');
                            console.info('Bilibili直播间挂机助手: 助手已启用功能：' + str);
                            TaskStart();
                        }, 3e3);
                    } else {
                        // 未登录
                        toast('你还没有登录，助手无法使用！', 'caution');
                        console.info('Bilibili直播间挂机助手: 你还没有登录，助手无法使用！');
                    }
                    return true;
                }
            }, 1, 500);
        } catch (err) {
            toast('Bilibili直播间挂机助手初始化时异常', 'error');
            console.error('Bilibili直播间挂机助手：初始化时异常');
            console.error(err);
        }
    }

    function InitAlertDialogGui() {
        DOM.alertdialog.div_background = $('<div id="' + NAME + '_alertdialog"/>');
        DOM.alertdialog.div_background[0].style = 'display: table;position: fixed;height: 100%;width: 100%;top: 0;left: 0;font-size: 12px;z-index: 10000;background-color: rgba(0,0,0,.5);';
        DOM.alertdialog.div_position = $('<div/>');
        DOM.alertdialog.div_position[0].style = 'display: table-cell;vertical-align: middle;';
        DOM.alertdialog.div_style = $('<div/>');
        DOM.alertdialog.div_style[0].style = 'position: relative;top: 50%;width: 40%;padding: 16px;border-radius: 5px;background-color: #fff;margin: 0 auto;';
        DOM.alertdialog.div_position.append(DOM.alertdialog.div_style);
        DOM.alertdialog.div_background.append(DOM.alertdialog.div_position);

        DOM.alertdialog.div_title = $('<div/>');
        DOM.alertdialog.div_title[0].style = 'position: relative;padding-bottom: 12px;';
        DOM.alertdialog.div_title_span = $('<span>提示</span>');
        DOM.alertdialog.div_title_span[0].style = 'margin: 0;color: #23ade5;font-size: 16px;';
        DOM.alertdialog.div_title.append(DOM.alertdialog.div_title_span);
        DOM.alertdialog.div_style.append(DOM.alertdialog.div_title);

        DOM.alertdialog.div_content = $('<div/>');
        DOM.alertdialog.div_content[0].style = 'display: inline-block;vertical-align: top;font-size: 14px;';
        DOM.alertdialog.div_style.append(DOM.alertdialog.div_content);

        DOM.alertdialog.div_button = $('<div/>');
        DOM.alertdialog.div_button[0].style = 'position: relative;height: 32px;margin-top: 12px;';
        DOM.alertdialog.div_style.append(DOM.alertdialog.div_button);

        DOM.alertdialog.button_ok = $('<button><span>确定</span></button>');
        DOM.alertdialog.button_ok[0].style = 'position: absolute;height: 100%;min-width: 68px;right: 0;background-color: #23ade5;color: #fff;border-radius: 4px;font-size: 14px;border: 0;cursor: pointer;';
        DOM.alertdialog.div_button.append(DOM.alertdialog.button_ok);
    }

    function InitConfigGui() {
        function recur(cfg, element) {
            for (var item in cfg) {
                var e, h, id = NAME + '_config_' + item;
                if (CONFIG_HELP_LIST[item]) {
                    h = $('<div class="BLRHH_help" id="' + NAME + '_config_help_' + item + '" style="display: inline;"><span class="BLRHH_clickable">?</span></div>');
                }
                switch (typeof cfg[item]) {
                    case 'string':
                    case 'number':
                        e = $('<div class="BLRHH_setting_item"></div>');
                        e.html('<label style="display: inline;" title="' + CONFIG_NAME_LIST[item] + '">' + CONFIG_NAME_LIST[item] + '<input id="' + id + '" type="text" class="BLRHH_input_text" placeholder="' + CONFIG_PLACEHOLDER_LIST[item] + '"></label>');
                        if (CONFIG_HELP_LIST[item] && h) e.append(h);
                        element.append(e);
                        break;
                    case 'boolean':
                        e = $('<div class="BLRHH_setting_item"></div>');
                        e.html('<label style="display: inline;" title="' + CONFIG_NAME_LIST[item] + '"><input id="' + id + '" type="checkbox" class="BLRHH_input_checkbox">' + CONFIG_NAME_LIST[item] + '</label>');
                        if (CONFIG_HELP_LIST[item] && h) e.append(h);
                        element.append(e);
                        if (CONFIG_CONTROL_LIST[item]) {
                            $('#' + id).addClass('BLRHH_control');
                        }
                        break;
                    case 'object':
                        if (Array.isArray(cfg[item])) {
                            e = $('<div class="BLRHH_setting_item"></div>');
                            e.html('<label style="display: inline;" title="' + CONFIG_NAME_LIST[item] + '">' + CONFIG_NAME_LIST[item] + '<input id="' + id + '" type="text" class="BLRHH_input_text" placeholder="' + CONFIG_PLACEHOLDER_LIST[item] + '"></label>');
                            if (CONFIG_HELP_LIST[item] && h) e.append(h);
                            element.append(e);
                        } else {
                            e = $('<div id="' + id + '" style="margin: 0px 0px 8px 12px;"/>');
                            element.append(e);
                            recur(cfg[item], e);
                        }
                        break;
                }
            }
        }

        execUntilSucceed(function() {
            if ($('#sidebar-vm div.side-bar-cntr')[0]) {
                // 加载css
                addCSS('.BLRHH_clickable {font-size: 12px;color: #0080c6;cursor: pointer;text-decoration: underline;}' +
                    '.BLRHH_setting_item {margin: 6px 0px;}' +
                    '.BLRHH_input_checkbox {vertical-align: bottom;}' +
                    '.BLRHH_input_text {margin: -2px 0 -2px 4px;padding: 0;}');
                // 绘制右下角按钮
                DOM.config.div_button_span = $('<span>挂机助手设置</span>');
                DOM.config.div_button_span[0].style = 'font-size: 12px;line-height: 16px;color: #0080c6;';
                DOM.config.div_button = $('<div/>');
                DOM.config.div_button[0].style = 'cursor: pointer;text-align: center;padding: 0px;';
                DOM.config.div_side_bar = $('<div/>');
                DOM.config.div_side_bar[0].style = 'width: 56px;height: 32px;overflow: hidden;position: fixed;right: 0px;bottom: 10%;padding: 4px 4px;background-color: rgb(255, 255, 255);z-index: 10001;border-radius: 8px 0px 0px 8px;box-shadow: rgba(0, 85, 255, 0.0980392) 0px 0px 20px 0px;border: 1px solid rgb(233, 234, 236);';
                DOM.config.div_button.append(DOM.config.div_button_span);
                DOM.config.div_side_bar.append(DOM.config.div_button);
                $('#sidebar-vm div.side-bar-cntr').after(DOM.config.div_side_bar);
                // 绘制设置界面
                DOM.config.div_position = $('<div/>');
                DOM.config.div_position[0].style = 'display: none;position: fixed;height: 300px;width: 300px;bottom: 5%;z-index: 9999;';
                DOM.config.div_style = $('<div/>');
                DOM.config.div_style[0].style = 'display: block;overflow: hidden;height: 300px;width: 300px;border-radius: 8px;box-shadow: rgba(106, 115, 133, 0.219608) 0px 6px 12px 0px;border: 1px solid rgb(233, 234, 236);background-color: rgb(255, 255, 255);';
                DOM.config.div_position.append(DOM.config.div_style);
                document.body.appendChild(DOM.config.div_position[0]);
                // 绘制标题栏及按钮
                DOM.config.div_title = $('<div/>');
                DOM.config.div_title[0].style = 'display: block;border-bottom: 1px solid #E6E6E6;height: 35px;line-height: 35px;margin: 0;padding: 0;overflow: hidden;';
                DOM.config.div_title_span = $('<span style="float: left;display: inline;padding-left: 8px;font: 700 14px/35px SimSun;">Bilibili直播间挂机助手</span>');
                DOM.config.div_title_button = $('<div/>');
                DOM.config.div_title_button[0].style = 'float: right;display: inline;padding-right: 8px;';
                DOM.config.div_button_reset = $('<div style="display: inline;"><span class="BLRHH_clickable">重置</span></div>');
                DOM.config.div_title_button.append(DOM.config.div_button_reset);
                DOM.config.div_title.append(DOM.config.div_title_span);
                DOM.config.div_title.append(DOM.config.div_title_button);
                DOM.config.div_style.append(DOM.config.div_title);
                // 绘制设置项内容
                DOM.config.div_context_position = $('<div/>');
                DOM.config.div_context_position[0].style = 'display: block;position: absolute;top: 36px;width: 100%;height: calc(100% - 36px);';
                DOM.config.div_context = $('<div/>');
                DOM.config.div_context[0].style = 'height: 100%;overflow: auto;padding: 0 12px;margin: 0px;';
                DOM.config.div_context_position.append(DOM.config.div_context);
                DOM.config.div_style.append(DOM.config.div_context_position);
                recur(CONFIG_DEFAULT, DOM.config.div_context);
                // 设置事件
                DOM.config.div_button.click(function() {
                    if (!DOM.config.is_showed) {
                        loadConfig();
                        DOM.config.div_position.css('right', DOM.config.div_side_bar[0].clientWidth + 'px');
                        DOM.config.div_position.show();
                        DOM.config.div_button_span.text('点击保存设置');
                        DOM.config.div_button_span.css('color', '#ff8e29');
                    } else {
                        saveConfig();
                        DOM.config.div_position.hide();
                        DOM.config.div_button_span.text('挂机助手设置');
                        DOM.config.div_button_span.css('color', '#0080c6');
                    }
                    DOM.config.is_showed = !DOM.config.is_showed;
                });
                DOM.config.div_button_reset.click(function() {
                    recurLoadConfig(CONFIG_DEFAULT);
                });
                $('.BLRHH_help').click(function() {
                    alertDialog('说明', typeof CONFIG_HELP_LIST[DOMhelptoItem($(this))] === 'function' ? CONFIG_HELP_LIST[DOMhelptoItem($(this))]() : CONFIG_HELP_LIST[DOMhelptoItem($(this))]);
                });
                $('.BLRHH_control').click(function() {
                    if ($(this).is(':checked')) {
                        $('#' + NAME + '_config_' + CONFIG_CONTROL_LIST[DOMtoItem($(this))]).show();
                    } else {
                        $('#' + NAME + '_config_' + CONFIG_CONTROL_LIST[DOMtoItem($(this))]).hide();
                    }
                });
                return true;
            }
        });
    }

    var SmallTV = {
        init: function(roomid) {
            API.SmallTV.check(roomid).done(function(response) { // 检查是否有小电视抽奖
                DEBUG('SmallTV.init: SmallTV.check', response);
                if (response.code === 0) {
                    response.data.forEach(function(v) {
                        var time = v.time;
                        if (v.status === 1) { // 可以参加
                            API.SmallTV.join(roomid, v.raffleId).done(function(response) {
                                DEBUG('SmallTV.init: SmallTV.join', response);
                                if (response.code === 0) {
                                    setTimeout(function() {
                                        SmallTV.notice(roomid, response.data.raffleId);
                                    }, time * 1e3 + 12e3);
                                    toast('[自动抽奖]已参加直播间【' + roomid + '】的小电视抽奖', 'success');
                                }
                            });
                        } else if (v.status === 2 && v.time > 0) { // 已参加且未开奖
                            setTimeout(function() {
                                SmallTV.notice(roomid, response.data.raffleId);
                            }, time * 1e3 + 12e3);
                            toast('[自动抽奖]已参加直播间【' + roomid + '】的小电视抽奖', 'success');
                        }

                    });
                } else if (response.code === -400) {
                    // 没有需要提示的小电视
                }
            });
        },
        notice: function(roomid, raffleId, cnt) {
            if (cnt > 5) return;
            API.SmallTV.notice(roomid, raffleId).done(function(response) {
                DEBUG('SmallTV.notice: SmallTV.notice', response);
                if (response.code === 0) {
                    if (response.data.status === 1) {
                        // 非常抱歉，您错过了此次抽奖，下次记得早点来哦
                    } else if (response.data.status === 2) {
                        if (response.data.gift_id === '-1' && !response.data.gift_name) {
                            toast('[自动抽奖]直播间【' + roomid + '】小电视抽奖结果：' + response.msg, 'info');
                        } else {
                            toast('[自动抽奖]直播间【' + roomid + '】小电视抽奖结果：' + response.data.gift_name + '*' + response.data.gift_num, 'info');
                        }
                    } else if (response.data.status === 3) {
                        // 还未开奖
                        setTimeout(function() {
                            SmallTV.notice(roomid, raffleId, cnt);
                        }, 6e3);
                    } else {
                        toast('[自动抽奖]直播间【' + roomid + '】小电视抽奖结果：' + response.msg, 'error');
                    }
                } else {
                    // 其他情况
                    setTimeout(function() {
                        SmallTV.notice(roomid, raffleId, cnt + 1);
                    }, 6e3);
                }
            });
        }
    };

    var Raffle = {
        init: function(roomid) {
            API.Raffle.check(roomid).done(function(response) { // 检查是否有活动抽奖
                DEBUG('Raffle.init: Raffle.check', response);
                if (response.code === 0) {
                    response.data.forEach(function(v) {
                        var time = v.time;
                        if (v.status === 1) { // 可以参加
                            API.Raffle.join(roomid, v.raffleId).done(function(response) {
                                DEBUG('Raffle.init: Raffle.join', response);
                                if (response.code === 0) {
                                    // 加入成功
                                    setTimeout(function() {
                                        Raffle.notice(roomid, response.data.raffleId);
                                    }, time * 1e3 + 24e3);
                                    toast('[自动抽奖]已参加直播间【' + roomid + '】的活动抽奖', 'success');
                                } else if (response.code === 65531) {
                                    // 65531: 非当前直播间或短ID直播间试图参加抽奖
                                    TaskLottery.stop = true;
                                    toast('[自动抽奖]参加活动抽奖失败，已停止活动抽奖任务', 'error');
                                    console.error('Bilibili直播间挂机助手：[自动抽奖]参加活动抽奖失败，已停止');
                                }
                            });
                        } else if (v.status === 2 && v.time > 0) { // 已参加且未开奖
                            setTimeout(function() {
                                Raffle.notice(roomid, response.data.raffleId);
                            }, time * 1e3 + 24e3);
                            toast('[自动抽奖]已参加直播间【' + roomid + '】的活动抽奖', 'success');
                        }
                    });
                }
            });
        },
        notice: function(roomid, raffleId, cnt) {
            if (cnt > 5) return;
            API.Raffle.notice(roomid, raffleId).done(function(response) {
                DEBUG('Raffle.notice: Raffle.notice', response);
                if (response.code === 0) {
                    if (response.data.gift_id === '-1') {
                        toast('[自动抽奖]直播间【' + roomid + '】活动抽奖结果：' + response.msg, 'info');
                    } else {
                        toast('[自动抽奖]直播间【' + roomid + '】活动抽奖结果：' + response.data.gift_name + '*' + response.data.gift_num, 'info');
                    }
                } else if (response.msg === '参数错误！') {
                    // 参数错误！
                } else if (response.msg === '尚未开奖，请耐心等待！') {
                    // 尚未开奖，请耐心等待！
                    setTimeout(function() {
                        Raffle.notice(roomid, raffleId, cnt);
                    }, 6e3);
                } else {
                    // 其他情况
                    setTimeout(function() {
                        Raffle.notice(roomid, raffleId, cnt + 1);
                    }, 6e3);
                }
            });
        }
    };

    var ZongDu = {
        init: function(roomid) {
            API.ZongDu.check(roomid).done(function(response) {
                DEBUG('ZongDu.init: ZongDu.check', response);
                if (response.code === 0 && response.data.hasOwnProperty('guard')) {
                    response.data.guard.forEach(function(v) {
                        if (v.status === 1) {
                            API.ZongDu.join(roomid, v.id, Info.csrf_token).done(function(response) {
                                DEBUG('ZongDu.init: ZongDu.join', response);
                                if (response.code === 0) {
                                    toast('[自动抽奖]已领取直播间【' + roomid + '】的总督奖励', 'success');
                                    toast(response.data.message, 'success');
                                }
                            });
                        }
                    });
                }
            });
        }
    };

    var Storm = {
        init: function(roomid) {
            API.Storm.check(roomid).done(function(response) { // 检查是否有节奏风暴
                DEBUG('Storm.init: Storm.check', response);
                if (response.code === 0 && !Array.isArray(response.data) && response.data.hasJoin === 0) {
                    Storm.join(response.data.id);
                }
            });
        },
        join: function(id, cnt) {
            if (cnt > 5) return;
            API.create(112, 32).done(function(response) {
                if (response.code === 0) {
                    DOM.storm.image[0].onload = function() {
                        var phrase = solveCaptcha(); // 识别验证码，未实现
                        API.Storm.join(id, response.data.token, phrase, Info.csrf_token).done(function(response) {
                            DEBUG('Storm.join: Storm.join', response);
                            if (response.code === 0) {
                                toast('[自动抽奖]节奏风暴抽奖结果：' + response.data.gift_name + '*' + response.data.gift_num, 'info');
                            } else {
                                setTimeout(function() {
                                    Storm.join(id, cnt + 1);
                                }, 1e3);
                            }
                        });
                    };
                    DOM.storm.image[0].src = response.data.image;
                }
            });
        }
    };

    var TaskAward = {
        treasure_timer: null,
        init: function() {
            if (!CONFIG.USE_AWARD) return;
            try {
                if (OCRAD);
            } catch (err) {
                toast('[自动领取瓜子]OCRAD初始化失败，已停止', 'error');
                console.error('Bilibili直播间挂机助手：[自动领取瓜子]OCRAD初始化失败，已停止');
                console.error(err);
                return;
            }
            try {
                TaskAward.getCurrentTask();
            } catch (err) {
                toast('[自动领取瓜子]运行时出现异常，已停止', 'error');
                console.error('Bilibili直播间挂机助手：[自动领取瓜子]运行时出现异常，已停止');
                console.error(err);
            }
        },
        getAward: function(callback, cnt) {
            if (!CONFIG.USE_AWARD) return;
            if (cnt > 5) {
                callback();
                return;
            }
            TaskAward.calcCaptcha(function(captcha) {
                if (captcha) {
                    // 验证码识别成功
                    API.SilverBox.getAward(ts_s(), ts_s(), captcha).done(function(response) {
                        DEBUG('TaskAward.getAward: getAward', response);
                        if (response.code === 0) {
                            // 领取瓜子成功
                            toast('[自动领取瓜子]领取了 ' + response.data.awardSilver + ' 银瓜子', 'success');
                            callback();
                        } else if (response.code === -903) {
                            // -903: 已经领取过这个宝箱
                            toast('[自动领取瓜子]已经领取过这个宝箱', 'caution');
                            callback();
                        } else if (response.code === -902 || response.code === -901) {
                            // -902: 验证码错误, -901: 验证码过期
                            setTimeout(function() {
                                TaskAward.getAward(callback, cnt);
                            }, 1e3);
                        } else {
                            // 其他错误
                            setTimeout(function() {
                                TaskAward.getAward(callback, cnt + 1);
                            }, 1e3);
                        }
                    });
                } else {
                    // 验证码识别失败
                    clearInterval(TaskAward.treasure_timer);
                    execUntilSucceed(function() {
                        if (DOM.treasure.div_timer) {
                            DOM.treasure.div_timer.hide();
                            return true;
                        }
                    });
                    execUntilSucceed(function() {
                        if (DOM.treasure.div_tip) {
                            DOM.treasure.div_tip.html('功能<br>异常');
                            return true;
                        }
                    });
                    toast('[自动领取瓜子]验证码识别失败，已停止', 'error');
                    console.error('Bilibili直播间挂机助手：[自动领取瓜子]验证码识别失败，已停止');
                }
            }, 0);
        },
        getCurrentTask: function() {
            if (!CONFIG.USE_AWARD) return;
            API.SilverBox.getCurrentTask().done(function(response) {
                DEBUG('TaskAward.getCurrentTask: getCurrentTask', response);
                if (response.code === 0) {
                    // 获取任务成功
                    if (parseInt(response.data.minute, 10) !== 0) {
                        setTimeout(function() {
                            TaskAward.getAward(TaskAward.getCurrentTask, 0);
                        }, response.data.minute * 60e3 + 1e3);
                        execUntilSucceed(function() {
                            if (DOM.treasure.div_timer) {
                                DOM.treasure.div_timer.text((response.data.minute * 60 + 1) + 's');
                                DOM.treasure.div_timer.show();
                                return true;
                            }
                        });
                        execUntilSucceed(function() {
                            if (DOM.treasure.div_tip) {
                                DOM.treasure.div_tip.html('次数<br>' + response.data.times + '/' + response.data.max_times + '<br>银瓜子<br>' + response.data.silver);
                                return true;
                            }
                        });
                    }
                } else if (response.code === -10017) {
                    // 今天所有的宝箱已经领完!
                    toast('[自动领取瓜子]' + response.msg, 'info');
                    clearInterval(TaskAward.treasure_timer);
                    execUntilSucceed(function() {
                        if (DOM.treasure.div_timer) {
                            DOM.treasure.div_timer.hide();
                            return true;
                        }
                    });
                    execUntilSucceed(function() {
                        if (DOM.treasure.div_tip) {
                            DOM.treasure.div_tip.html('今日<br>已领完');
                            return true;
                        }
                    });
                    tommorrowRun(function() {
                        TaskAward.init();
                    });
                } else {
                    toast('[自动领取瓜子]' + response.msg, 'info');
                }
            });
        },
        calcCaptcha: function(callback, cnt) {
            if (!CONFIG.USE_AWARD) return;
            if (cnt > 30) { // 允许验证码无法识别的次数
                callback(null);
                return;
            }
            // 实现功能类似 https://github.com/zacyu/bilibili-helper/blob/master/src/bilibili_live.js 中Live.treasure.init()的验证码处理部分
            // 需要ES6
            API.SilverBox.getCaptcha(ts_ms()).done(function(response) {
                if (response.code === 0) {
                    DOM.treasure.image[0].onload = function() {
                        let ctx = DOM.treasure.canvas[0].getContext("2d");
                        ctx.font = '40px agencyfbbold';
                        ctx.textBaseline = 'top';
                        ctx.clearRect(0, 0, DOM.treasure.canvas[0].width, DOM.treasure.canvas[0].height);
                        ctx.drawImage(DOM.treasure.image[0], 0, 0);
                        let grayscaleMap = TaskAward.OCR.getGrayscaleMap(ctx);
                        let filterMap = TaskAward.OCR.orderFilter2In3x3(grayscaleMap);
                        ctx.clearRect(0, 0, 120, 40);
                        for (let i = 0; i < filterMap.length; ++i) {
                            let gray = filterMap[i];
                            ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
                            ctx.fillRect(i % 120, Math.round(i / 120), 1, 1);
                        }
                        try {
                            let question = TaskAward.correctQuestion(OCRAD(ctx.getImageData(0, 0, 120, 40)));
                            DEBUG('TaskAward.calcCaptcha', 'question= ' + question);
                            let answer = TaskAward.eval(question);
                            DEBUG('TaskAward.calcCaptcha', 'answer= ' + answer);
                            if (answer !== undefined) {
                                // toast('[自动领取瓜子]验证码识别结果：' + question + ' = ' + answer, 'info');
                                console.info('Bilibili直播间挂机助手：[自动领取瓜子]验证码识别结果：' + question + ' = ' + answer);
                                callback(answer);
                            } else {
                                throw new Error('验证码识别失败');
                            }
                        } catch (err) {
                            setTimeout(function() {
                                TaskAward.calcCaptcha(callback, cnt + 1);
                            }, 300);
                        }
                    };
                    DOM.treasure.image[0].src = response.data.img;
                }
            });
        },
        // 对B站验证码进行处理，需要ES6
        // 代码来源：https://github.com/zacyu/bilibili-helper/blob/master/src/bilibili_live.js
        // 未作修改
        OCR: {
            getGrayscaleMap: (context, rate = 235, width = 120, height = 40) => {
                function getGrayscale(x, y) {
                    const pixel = context.getImageData(x, y, 1, 1).data;
                    return pixel ? (77 * pixel[0] + 150 * pixel[1] + 29 * pixel[2] + 128) >> 8 : 0;
                }
                const map = [];
                for (let y = 0; y < height; y++) { // line y
                    for (let x = 0; x < width; x++) { // column x
                        const gray = getGrayscale(x, y);
                        map.push(gray > rate ? gray : 0);
                    }
                }
                return map;
            },
            orderFilter2In3x3: (grayscaleMap, n = 9, width = 120, height = 40) => {
                const gray = (x, y) => (x + y * width >= 0) ? grayscaleMap[x + y * width] : 255;
                const map = [];
                const length = grayscaleMap.length;
                const catchNumber = n - 1;
                for (let i = 0; i < length; ++i) {
                    const [x, y] = [i % width, Math.floor(i / width)];
                    const matrix = new Array(9);
                    matrix[0] = gray(x - 1, y - 1);
                    matrix[1] = gray(x + 0, y - 1);
                    matrix[2] = gray(x + 1, y - 1);
                    matrix[3] = gray(x - 1, y + 0);
                    matrix[4] = gray(x + 0, y + 0);
                    matrix[5] = gray(x + 1, y + 0);
                    matrix[6] = gray(x - 1, y + 1);
                    matrix[7] = gray(x + 0, y + 1);
                    matrix[8] = gray(x + 1, y + 1);
                    matrix.sort((a, b) => a - b);
                    map.push(matrix[catchNumber]);
                }
                return map;
            },
            execMap: (connectMap, rate = 4) => {
                const map = [];
                const connectMapLength = connectMap.length;
                for (let i = 0; i < connectMapLength; ++i) {
                    let blackPoint = 0;
                    const [x, y] = [i % 120, Math.round(i / 120)];
                    const top = connectMap[i - 120];
                    const topLeft = connectMap[i - 120 - 1];
                    const topRight = connectMap[i - 120 + 1];
                    const left = connectMap[i - 1];
                    const right = connectMap[i + 1];
                    const bottom = connectMap[i + 120];
                    const bottomLeft = connectMap[i + 120 - 1];
                    const bottomRight = connectMap[i + 120 + 1];
                    if (top) blackPoint += 1;
                    if (topLeft) blackPoint += 1;
                    if (topRight) blackPoint += 1;
                    if (left) blackPoint += 1;
                    if (right) blackPoint += 1;
                    if (bottom) blackPoint += 1;
                    if (bottomLeft) blackPoint += 1;
                    if (bottomRight) blackPoint += 1;
                    if (blackPoint > rate) map.push(1);
                    else map.push(0);
                }
                return map;
            }
        },
        eval: (fn) => {
            let Fn = Function;
            return new Fn('return ' + fn)();
        },
        // 修正OCRAD识别结果，需要ES6
        // 代码来源：https://github.com/zacyu/bilibili-helper/blob/master/src/bilibili_live.js
        // 修改部分：
        // 1.将correctStr声明在correctQuestion函数内部，并修改相关引用
        // 2.在correctStr中增加'>': 3
        correctQuestion: (question) => {
            var correctStr = {
                'g': 9,
                'z': 2,
                'Z': 2,
                'o': 0,
                'l': 1,
                'B': 8,
                'O': 0,
                'S': 6,
                's': 6,
                'i': 1,
                'I': 1,
                '.': '-',
                '_': 4,
                'b': 6,
                'R': 8,
                '|': 1,
                'D': 0,
                '>': 3
            };
            var q = '',
                question = question.trim();
            for (let i in question) {
                let a = correctStr[question[i]];
                q += (a != undefined ? a : question[i]);
            }
            if (q[2] == '4') q[2] = '+';
            return q;
        }
    };

    var TaskLottery = {
        stop: false,
        period: 20,
        // last_list: [],
        init: function() {
            try {
                if (!CONFIG.USE_LOTTERY) return;
                execUntilSucceed(function() {
                    if (window.Lottery_inited) {
                        TaskLottery.work();
                        return true;
                    }
                }, 10e3, 1e3);
            } catch (err) {
                toast('[自动抽奖]运行时出现异常，已停止', 'error');
                console.error('Bilibili直播间挂机助手：[自动抽奖]运行时出现异常，已停止');
                console.error(err);
            }
        },
        work: function() {
            if (TaskLottery.stop) return;
            if (!CONFIG.USE_LOTTERY) return;
            var lottery_list = [],
                // lottery_list_temp = [],
                overlap_index = Infinity;
            $('div.chat-item.system-msg div.msg-content a.link').each(function(index, el) {
                var matched = el.href.match(/\/(\d+)(\?visit_id=?.*)?/);
                if (matched && matched[1] && !matched[2]) {
                    lottery_list.push(matched[1]);
                    el.href += '?visit_id=' + Info.visit_id;
                }
            });
            /*
            $.each(lottery_list_temp, function(i, v) {
                if (i === 0) {
                    var index = $.inArray(v, TaskLottery.last_list);
                    if (index > -1) {
                        overlap_index = TaskLottery.last_list.length - index;
                    } else {
                        overlap_index = 0;
                        lottery_list.push(v);
                    }
                } else if (i >= overlap_index) {
                    lottery_list.push(v);
                }
            });
            DEBUG('TaskLottery.work: last_list', TaskLottery.last_list.toString());
            TaskLottery.last_list = lottery_list_temp;
            lottery_list_temp = lottery_list;
            lottery_list = [];
            lottery_list_temp.forEach(function(v) {
                if ($.inArray(v, lottery_list) === -1) lottery_list.push(v);
            });
            */
            DEBUG('TaskLottery.work: list', lottery_list.toString());
            // 根据可抽奖的房间数自动调整检测周期
            if (lottery_list.length > 10) {
                TaskLottery.period = 3;
            } else if (lottery_list.length > 8) {
                TaskLottery.period = 6;
            } else if (lottery_list.length > 5) {
                TaskLottery.period = 10;
            } else if (lottery_list.length > 1) {
                TaskLottery.period = 15;
            } else {
                TaskLottery.period = 20;
            }
            $.each(lottery_list, function(i, v) {
                window.Lottery_join(i, v);
            });
            setTimeout(TaskLottery.work, TaskLottery.period * 1e3);
        }
    };

    var TaskSign = {
        init: function() {
            try {
                if (!CONFIG.USE_SIGN) return;
                API.sign.GetSignInfo().done(function(response) {
                    DEBUG('TaskSign.init: GetSignInfo', response);
                    if (response.code === 0) {
                        if (response.data.status === 0) {
                            // 未签到
                            API.sign.doSign().done(function(response) {
                                DEBUG('TaskSign.init: doSign', response);
                                if (response.code === 0) {
                                    // 签到成功
                                    toast(response.data.text, 'success');
                                } else {
                                    toast(response.data.text, 'error');
                                }
                            });
                        } else if (response.data.status === 1) {
                            // 已签到
                            toast('[自动签到]今日已签到：' + response.data.text, 'success');
                        }
                    }
                });
                tommorrowRun(TaskSign.init);
            } catch (err) {
                toast('[自动签到]运行时出现异常，已停止', 'error');
                console.error('Bilibili直播间挂机助手：[自动签到]运行时出现异常，已停止');
                console.error(err);
            }
        }
    };

    var TaskTask = {
        init: function() {
            try {
                if (!CONFIG.USE_TASK) return;
                setTimeout(TaskTask.work, 6e3);
            } catch (err) {
                toast('[自动完成任务]运行时出现异常，已停止', 'error');
                console.error('Bilibili直播间挂机助手：[自动完成任务]运行时出现异常，已停止');
                console.error(err);
            }
        },
        work: function() {
            if (!CONFIG.USE_TASK) return;
            toast('[自动完成任务]检查任务完成情况', 'info');
            API.i.taskInfo().done(function(response) {
                DEBUG('TaskTask.work: taskInfo', response);
                if (response.code === 0) {
                    for (var key in response.data) {
                        if (response.data[key].task_id && response.data[key].status) {
                            // 当前对象是任务且任务可完成
                            TaskTask.receiveAward(response.data[key].task_id);
                        }
                    }
                }
            });
            API.activity.user_limit_tasks().done(function(response) {
                DEBUG('TaskTask.work: user_limit_tasks', response);
                if (response.code === 0) {
                    for (var key in response.data) {
                        if (response.data[key].task_id && response.data[key].status) {
                            // 当前对象是任务且任务可完成
                            TaskTask.receiveAward(response.data[key].task_id);
                        }
                    }
                }
            });
            API.activity.master_limit_tasks().done(function(response) {
                DEBUG('TaskTask.work: master_limit_tasks', response);
                if (response.code === 0) {
                    for (var key in response.data) {
                        if (response.data[key].task_id && response.data[key].status) {
                            // 当前对象是任务且任务可完成
                            TaskTask.receiveAward(response.data[key].task_id);
                        }
                    }
                }
            });
            setTimeout(TaskTask.work, 3600e3);
        },
        receiveAward: function(task_id) {
            if (!CONFIG.USE_TASK) return;
            API.activity.receive_award(task_id, Info.csrf_token).done(function(response) {
                DEBUG('TaskTask.receiveAward: receive_award', response);
                if (response.code === 0) {
                    // 完成任务
                    toast('[自动完成任务]完成任务：' + task_id, 'success');
                }
            });
        }
    };

    var TaskGift = {
        init: function() {
            try {
                if (!CONFIG.USE_GIFT) return;
                if (!(CONFIG.GIFT_CONFIG.SHORT_ROOMID === 0 || CONFIG.GIFT_CONFIG.SHORT_ROOMID === Info.short_id)) return;
                if (Info.medal_target_id !== Info.ruid) {
                    if (!CONFIG.GIFT_CONFIG.CHANGE_MEDAL) {
                        toast('[自动送礼]已佩戴的勋章不是当前主播勋章，送礼功能停止', 'caution');
                        return;
                    }
                    API.i.medal(1, 25).done(function(response) {
                        DEBUG('TaskGif.init: medal', response);
                        if (response.code === 0) {
                            Info.medal_list = response.data.fansMedalList;
                            $.each(Info.medal_list, function(index, v) {
                                if (v.target_id === Info.ruid) {
                                    API.i.ajaxWearFansMedal(v.medal_id).done(function(response) {
                                        DEBUG('TaskGift.init: ajaxWearFansMedal', response);
                                        toast('[自动送礼]已自动切换为当前主播勋章', 'success');
                                        toast('[自动送礼]请注意送礼设置，30秒后开始送礼', 'caution');
                                        setTimeout(TaskGift.work, 30e3);
                                    });
                                    return false;
                                }
                            });
                        }
                    });
                } else {
                    toast('[自动送礼]请注意送礼设置，30秒后开始送礼', 'caution');
                    setTimeout(TaskGift.work, 30e3);
                }
            } catch (err) {
                toast('[自动送礼]运行时出现异常，已停止', 'error');
                console.error('Bilibili直播间挂机助手：[自动送礼]运行时出现异常，已停止');
                console.error(err);
            }
        },
        work: function() {
            if (!CONFIG.USE_GIFT) return;
            API.live_user.get_weared_medal(Info.uid, Info.roomid, Info.csrf_token).done(function(response) {
                if (response.code === 0) {
                    Info.medal_target_id = response.data.target_id;
                    if (Info.medal_target_id !== Info.ruid) {
                        setTimeout(TaskGift.init, 1e3);
                        return;
                    }
                    Info.today_feed = parseInt(response.data.today_feed, 10);
                    Info.day_limit = response.data.day_limit;
                    var remain_feed = Info.day_limit - Info.today_feed;
                    if (remain_feed > 0) {
                        toast('[自动送礼]今日亲密度未满，送礼开始', 'info');
                        API.gift.bag_list().done(function(response) {
                            DEBUG('TaskGift.work: bag_list', response);
                            if (response.code === 0) {
                                Info.bag_list = response.data.list;
                                TaskGift.send_gift(0, remain_feed);
                            } else {
                                toast('[自动送礼]获取包裹礼物异常，' + response.msg, 'error');
                            }
                        });
                    } else {
                        toast('[自动送礼]今日亲密度已满', 'success');
                        tommorrowRun(TaskGift.init);
                    }
                } else {
                    toast('[自动送礼]获取亲密度异常，' + response.msg, 'error');
                }
            });
        },
        send_gift: function(i, remain_feed) {
            i += 0;
            if (remain_feed > 0) {
                if (i >= Info.bag_list.length) {
                    toast('[自动送礼]送礼结束，1小时后再次送礼', 'success');
                    setTimeout(TaskGift.work, 3600e3);
                    return;
                }
                var v = Info.bag_list[i];
                v.gift_id += '';
                if (($.inArray(v.gift_id, CONFIG.GIFT_CONFIG.ALLOW_GIFT) > -1 || !CONFIG.GIFT_CONFIG.ALLOW_GIFT.length) && // 检查ALLOW_GIFT
                    ((CONFIG.GIFT_CONFIG.SEND_GIFT.length && $.inArray(v.gift_id, CONFIG.GIFT_CONFIG.SEND_GIFT) > -1 && remain_feed > 0) || // 检查SEND_GIFT
                        (CONFIG.GIFT_CONFIG.SEND_TODAY && v.expire_at > ts_s() && v.expire_at - ts_s() < 86400))) { // 检查SEND_TODAY和礼物到期时间
                    var feed_single = giftIDtoFeed(v.gift_id);
                    if (feed_single > 0) {
                        var feed_num = Math.floor(remain_feed / feed_single);
                        if (feed_num > v.gift_num) feed_num = v.gift_num;
                        if (feed_num > 0) {
                            API.gift.bag_send(Info.uid, v.gift_id, Info.ruid, feed_num, v.bag_id, Info.roomid, Info.rnd, Info.csrf_token).done(function(response) {
                                DEBUG('TaskGift.send_gift: bag_send', response);
                                if (response.code === 0) {
                                    // 送礼成功
                                    Info.rnd = response.data.rnd;
                                    toast('[自动送礼]包裹送礼成功，送出' + feed_num + '个' + v.gift_name, 'success');
                                } else {
                                    toast('[自动送礼]包裹送礼异常，' + response.msg, 'error');
                                }
                                TaskGift.send_gift(i + 1, remain_feed - feed_num * feed_single);
                            });
                        } else {
                            TaskGift.send_gift(i + 1, remain_feed);
                        }
                    } else {
                        TaskGift.send_gift(i + 1, remain_feed);
                    }
                } else {
                    TaskGift.send_gift(i + 1, remain_feed);
                }
            } else {
                toast('[自动送礼]送礼结束，今日亲密度已满', 'success');
                tommorrowRun(TaskGift.init);
            }
        }
    };

    var TaskExchange = {
        init: function() {
            try {
                if (!CONFIG.EXCHANGE_SILVER2COIN) return;
                API.SilverCoinExchange.silver2coin(Info.csrf_token).done(function(response) {
                    DEBUG('TaskExchange.init: silver2coin', response);
                    if (response.code === 0) {
                        // 兑换成功
                        toast('[银瓜子兑换硬币]银瓜子兑换硬币：兑换成功', 'success');
                    } else if (response.code === 403) {
                        // 每天最多能兑换 1 个
                        toast('[银瓜子兑换硬币]银瓜子兑换硬币：每天最多能兑换 1 个', 'info');
                    } else {
                        toast('[银瓜子兑换硬币]银瓜子兑换硬币：' + response.msg, 'info');
                    }
                });
                tommorrowRun(TaskExchange.init);
            } catch (err) {
                toast('[银瓜子兑换硬币]运行时出现异常，已停止', 'error');
                console.error('Bilibili直播间挂机助手：[银瓜子兑换硬币]运行时出现异常，已停止');
                console.error(err);
            }
        }
    };

    function TaskStart() {
        if (CONFIG.USE_SIGN) TaskSign.init();
        if (CONFIG.USE_AWARD) TaskAward.init();
        if (CONFIG.USE_LOTTERY) TaskLottery.init();
        if (CONFIG.USE_TASK) TaskTask.init();
        if (CONFIG.USE_GIFT) TaskGift.init();
        if (CONFIG.EXCHANGE_SILVER2COIN) TaskExchange.init();
    }

    $(document).ready(function() {
        Init();
    });

})();