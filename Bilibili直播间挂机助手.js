// ==UserScript==
// @name         Bilibili直播间挂机助手
// @namespace    SeaLoong
// @version      2.0.0
// @description  Bilibili直播间自动签到，领瓜子，参加抽奖，完成任务，送礼等
// @author       SeaLoong
// @homepageURL  https://github.com/SeaLoong/Bilibili-LRHH
// @supportURL   https://github.com/SeaLoong/Bilibili-LRHH/issues
// @updateURL    https://raw.githubusercontent.com/SeaLoong/Bilibili-LRHH/master/Bilibili%E7%9B%B4%E6%92%AD%E9%97%B4%E6%8C%82%E6%9C%BA%E5%8A%A9%E6%89%8B.js
// @downloadURL  https://raw.githubusercontent.com/SeaLoong/Bilibili-LRHH/master/Bilibili%E7%9B%B4%E6%92%AD%E9%97%B4%E6%8C%82%E6%9C%BA%E5%8A%A9%E6%89%8B.js
// @include      /https?:\/\/live\.bilibili\.com\/\d+\??.*/
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @require      https://raw.githubusercontent.com/SeaLoong/Bilibili-LRHH/master/BilibiliAPI.js
// @require      https://raw.githubusercontent.com/antimatter15/ocrad.js/master/ocrad.js
// @grant        none
// @run-at       document-start
// @license      MIT License
// ==/UserScript==

/*
若遇到脚本加载需要很久且自动领取瓜子功能不能正常使用，请尝试将上面的
// @require      https://greasyfork.org/scripts/44866-ocrad/code/OCRAD.js
替换为
// @require      https://raw.githubusercontent.com/antimatter15/ocrad.js/master/ocrad.js
然后刷新页面重新加载脚本
*/

(function BLRHH() {
    'use strict';

    const NAME = 'BLRHH';

    let API;
    try {
        API = BilibiliAPI;
    } catch (err) {
        window.toast('BilibiliAPI初始化失败，脚本已停用！', 'error');
        console.error(err);
        return;
    }

    const DEBUGMODE = true;
    const DEBUG = (sign, ...data) => {
        if (!DEBUGMODE) return;
        let d = new Date();
        d = '[' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds() + '.' + d.getMilliseconds() + ']';
        console.debug('[' + NAME + ']' + d, sign + ':', data);
    };

    let CONFIG;
    let CACHE;
    let Info = {
        short_id: undefined,
        roomid: undefined,
        uid: undefined,
        ruid: undefined,
        rnd: undefined,
        csrf_token: undefined,
        visit_id: undefined,
        silver: undefined,
        gold: undefined,
        mobile_verify: undefined,
        identification: undefined,
        gift_list: undefined,
        gift_list_str: '礼物对照表'
    };

    const ts_s = () => {
        return Math.floor(Date.now() / 1000);
    };

    const ts_ms = () => {
        return Date.now();
    };

    const runUntilSucceed = (callback, delay = 1, period = 100) => {
        setTimeout(() => {
            if (!callback()) {
                runUntilSucceed(callback, period, period);
            }
        }, delay);
    };

    const tommorrowRun = (callback) => {
        let t = new Date();
        do {
            t.setHours(t.getHours() + 1);
        } while (t.getHours() !== 0);
        setTimeout(callback, t.valueOf() - Date.now());
    };

    const isSubScript = () => window.frameElement && window.parent[NAME];

    if (isSubScript()) {
        try {
            window.stop();
            const Lottery = {
                ws: undefined,
                Gift: {
                    fishingCheck: (roomid) => {
                        const p = $.Deferred();
                        API.room.room_init(roomid).then((response) => {
                            if (response.code === 0) {
                                if (response.data.is_hidden || response.data.is_locked || response.data.encrypted || response.data.pwd_verified) return p.resolve(true);
                                return p.resolve(false);
                            }
                            p.reject();
                        }, () => {
                            p.reject();
                        }).always(() => {
                            API.room.room_entry_action(roomid, Info.visit_id, Info.csrf_token);
                        });
                        return p;
                    },
                    run: (roomid) => {
                        // 全部参加完成返回resolve，任意一个失败返回reject
                        try {
                            if (window.parent[NAME].Lottery.stop) return $.Deferred().reject();
                            return Lottery.Gift.fishingCheck(roomid).then((fishing) => {
                                if (!fishing) {
                                    return API.Lottery.Gift.check(roomid).then((response) => {
                                        DEBUG('Lottery.Gift.run: API.Lottery.Gift.check', response);
                                        if (response.code === 0) {
                                            return Lottery.Gift.join(roomid, response.data.list);
                                        } else if (response.code === -400) {
                                            // 没有需要提示的小电视
                                        } else {
                                            window.toast('[自动抽奖][礼物抽奖]' + response.msg, 'caution');
                                        }
                                    }, () => {
                                        window.toast('[自动抽奖][礼物抽奖]检查直播间(' + roomid + ')失败，请检查网络', 'error');
                                    });
                                }
                            });
                        } catch (err) {
                            window.parent[NAME].Lottery.stop = true;
                            window.toast('[自动抽奖][礼物抽奖]运行时出现异常，已停止', 'error');
                            console.error(err);
                            return $.Deferred().reject();
                        }
                    },
                    join: (roomid, raffleList, i = 0) => {
                        if (window.parent[NAME].Lottery.stop) return $.Deferred().reject();
                        if (i >= raffleList.length) return $.Deferred().resolve();
                        const obj = raffleList[i];
                        obj.raffleId = parseInt(obj.raffleId, 10); // 有时候会出现raffleId是string的情况(破站)
                        // raffleId过滤，防止重复参加
                        if (window[NAME].Lottery.list.some(v => v === obj.raffleId)) return Lottery.Gift.join(roomid, raffleList, i + 1);

                        const p = $.Deferred(); // 这个Promise在notice之后resolve，如果设置不提示则直接resolve
                        const p1 = $.Deferred(); // 这个Promise在延时时间到的时候resolve
                        p1.then(() => {
                            // 时间到，开始参加
                            const removeRaffleId = (raffleId) => {
                                $.each(window[NAME].Lottery.list, (i, v) => {
                                    if (v === raffleId) {
                                        window[NAME].Lottery.list.splice(i, 1);
                                        return false;
                                    }
                                });
                            };
                            window[NAME].Lottery.list.push(obj.raffleId); // 加入raffleId记录列表
                            // 随机判断是否丢弃这次抽奖
                            if (Math.random() < CONFIG.AUTO_LOTTERY_CONFIG.GIFT_LOTTERY_CONFIG.DISCARD_RATE) {
                                // 丢弃抽奖
                                window.toast('[自动抽奖][礼物抽奖]忽略抽奖(roomid=' + roomid + ',raffleId=' + obj.raffleId + ')', 'info');
                                p.resolve();
                            } else {
                                const toNotice = () => { // 可以notice的情况
                                    if (CONFIG.AUTO_LOTTERY_CONFIG.GIFT_LOTTERY_CONFIG.IGNORE_NOTICE) {
                                        removeRaffleId(obj.raffleId);
                                        p.resolve();
                                    } else {
                                        // 等待时间到后notice
                                        const p3 = $.Deferred();
                                        p3.then(() => Lottery.Gift.notice(roomid, obj.raffleId, obj.type).then(() => {
                                            removeRaffleId(obj.raffleId);
                                            p.resolve();
                                        }, () => {
                                            removeRaffleId(obj.raffleId);
                                            p.reject();
                                        }));
                                        setTimeout(() => p3.resolve(), obj.time * 1e3 + Math.random() * 10e3 + 10e3);
                                    }
                                };
                                if (obj.status === 1) { // 可以参加
                                    API.Lottery.Gift.join(roomid, obj.raffleId, Info.csrf_token, Info.visit_id).then((response) => {
                                        DEBUG('Lottery.Gift.join: API.Lottery.Gift.join', response);
                                        switch (response.code) {
                                            case 0:
                                                window.toast('[自动抽奖][礼物抽奖]已参加抽奖(roomid=' + roomid + ',raffleId=' + obj.raffleId + ')', 'success');
                                                toNotice();
                                                break;
                                            case 400:
                                                window.parent[NAME].Lottery.stop = true;
                                                window.toast('[自动抽奖][礼物抽奖]访问被拒绝，您的帐号可能已经被封禁，已停止', 'error');
                                                p.reject();
                                                break;
                                            case 402:
                                                // 抽奖已过期，下次再来吧
                                                p.reject();
                                                break;
                                            case 65531:
                                                // 65531: 非当前直播间或短ID直播间试图参加抽奖
                                                window.parent[NAME].Lottery.stop = true;
                                                window.toast('[自动抽奖][礼物抽奖]参加抽奖(roomid=' + roomid + ',raffleId=' + obj.raffleId + ')失败，已停止', 'error');
                                                p.reject();
                                                break;
                                            default:
                                                window.toast('[自动抽奖][礼物抽奖]参加抽奖(roomid=' + roomid + ',raffleId=' + obj.raffleId + ')' + response.msg, 'caution');
                                                toNotice();
                                        }
                                    }, () => {
                                        window.toast('[自动抽奖][礼物抽奖]参加抽奖(roomid=' + roomid + ',raffleId=' + obj.raffleId + ')失败，请检查网络', 'error');
                                        p.reject();
                                    });
                                } else if (obj.status === 2 && obj.time > 0) { // 已参加且未开奖
                                    toNotice();
                                }
                            }
                        });
                        // 延时等待
                        const randomNumber = (min = 0, max = 1) => min + (max - min) * Math.random();
                        setTimeout(() => p1.resolve(), randomNumber(CONFIG.AUTO_LOTTERY_CONFIG.GIFT_LOTTERY_CONFIG.DELAY_MIN, CONFIG.AUTO_LOTTERY_CONFIG.GIFT_LOTTERY_CONFIG.DELAY_MAX) * 1e3);
                        return $.when(Lottery.Gift.join(roomid, raffleList, i + 1), p);
                    },
                    notice: (roomid, raffleId, type) => {
                        // notice成功返回resolve，失败返回reject
                        if (window.parent[NAME].Lottery.stop) return $.Deferred().reject();
                        if (CONFIG.AUTO_LOTTERY_CONFIG.GIFT_LOTTERY_CONFIG.IGNORE_NOTICE) return $.Deferred().resolve();
                        // 如果raffleId记录列表里没有这个raffleId，那么说明已经被处理，不需要notice，返回resolve
                        if (window[NAME].Lottery.list.every(v => v !== raffleId)) return $.Deferred().resolve();
                        return API.Lottery.Gift.notice(raffleId, type).then((response) => {
                            DEBUG('Lottery.Gift.notice: API.Lottery.Gift.notice', response);
                            if (response.code === 0) {
                                switch (response.data.status) {
                                    case 1:
                                        // 非常抱歉，您错过了此次抽奖，下次记得早点来哦
                                        break;
                                    case 2:
                                        if (response.data.gift_id === '-1' && !response.data.gift_name) {
                                            window.toast('[自动抽奖][礼物抽奖]抽奖(roomid=' + roomid + ',raffleId=' + raffleId + ')结果：' + response.msg, 'info');
                                        } else {
                                            window.toast('[自动抽奖][礼物抽奖]抽奖(roomid=' + roomid + ',raffleId=' + raffleId + ')结果：' + response.data.gift_name + '*' + response.data.gift_num, 'info');
                                        }
                                        break;
                                    case 3:
                                        // 还未开奖
                                        const p = $.Deferred();
                                        p.then(() => Lottery.Gift.notice(roomid, raffleId, type));
                                        setTimeout(() => p.resolve(), 10e3);
                                        return p;
                                    default:
                                        window.toast('[自动抽奖][礼物抽奖]抽奖(roomid=' + roomid + ',raffleId=' + raffleId + ')结果：' + response.msg, 'caution');
                                }
                            } else {
                                // 其他情况
                                window.toast('[自动抽奖][礼物抽奖]抽奖(roomid=' + roomid + ',raffleId=' + raffleId + ')' + response.msg, 'caution');
                            }
                        }, () => {
                            window.toast('[自动抽奖][礼物抽奖]获取抽奖(roomid=' + roomid + ',raffleId=' + raffleId + ')结果失败，请检查网络');
                        });
                    }
                }
            };
            let timer_clear = setInterval(() => {
                try {
                    document.body.innerHTML = '';
                    document.getElementsByTagName('head')[0].innerHTML = '';
                } catch (err) {};
            }, 2e3);
            window.toast = window.parent.toast;
            Info = window.parent[NAME].Info;
            CONFIG = window.parent[NAME].CONFIG;
            CACHE = window.parent[NAME].CACHE;
            // 读取父脚本数据
            window[NAME].promise.sync.then(() => {
                Info = window.parent[NAME].Info;
                CONFIG = window.parent[NAME].CONFIG;
                CACHE = window.parent[NAME].CACHE;
                window[NAME].promise.sync = $.Deferred();
            });
            window[NAME].Lottery = {
                list: []
            };
            let timer_next;
            let new_raffle = false;
            let run_finished = false;
            let raffleList = [];
            Lottery.ws = new API.DanmuWebSocket(Info.uid, window[NAME].roomid);
            Lottery.ws.bind((ws) => {
                Lottery.ws = ws;
            }, undefined, undefined, (obj) => {
                switch (obj.cmd) {
                    case 'RAFFLE_START':
                        // 可能是有连续送礼，直到连续5s后没有RAFFLE_START
                        new_raffle = true;
                        raffleList.push({
                            raffleId: obj.data.raffleId,
                            type: obj.data.type,
                            time: obj.data.time,
                            status: 1
                        });
                        if (timer_next) clearTimeout(timer_next);
                        timer_next = setTimeout(() => {
                            timer_next = undefined;
                            Lottery.Gift.join(window[NAME].roomid, raffleList).always(() => {
                                raffleList = [];
                                if (run_finished) {
                                    Lottery.ws.close();
                                    Lottery.ws = undefined;
                                    clearInterval(timer_clear);
                                    timer_clear = undefined;
                                    window[NAME].promise.finish.resolve();
                                }
                            });
                        }, 5e3);
                        // 自创一个raffleList，再按照run里的方式处理
                        break;
                    case 'RAFFLE_END':
                        Lottery.Gift.notice(window[NAME].roomid, obj.data.raffleId, obj.data.type).always(() => {
                            $.each(window[NAME].Lottery.list, (i, v) => {
                                if (v === parseInt(obj.raffleId, 10)) {
                                    window[NAME].Lottery.list.splice(i, 1);
                                    return false;
                                }
                            });
                            if (window[NAME].Lottery.list.length === 0) {
                                Lottery.ws.close();
                                Lottery.ws = undefined;
                                clearInterval(timer_clear);
                                timer_clear = undefined;
                                window[NAME].promise.finish.resolve();
                            }
                        });
                        break;
                    case 'SPECIAL_GIFT':
                        if (obj.data['39'] !== undefined) {
                            switch (obj.data['39'].action) {
                                case 'start':
                                    // 节奏风暴开始
                                case 'end':
                                    // 节奏风暴结束
                            }
                        };
                    default:
                        break;
                }
            });
            Lottery.Gift.run(window[NAME].roomid).always(() => {
                run_finished = true;
                if (!new_raffle) {
                    Lottery.ws.close();
                    Lottery.ws = undefined;
                    clearInterval(timer_clear);
                    timer_clear = undefined;
                    window[NAME].promise.finish.resolve();
                }
            });
        } catch (err) {
            console.error('[' + NAME + ']子脚本运行时出现异常，已停止并关闭子页面');
            console.error(err);
            window[NAME].promise.finish.resolve();
        }
    } else {
        // TODO
        /*
        const get_cid = (av) => {
            const p = $.Deferred();
            BilibiliAPI.ajax({
                url: '//www.bilibili.com/video/av' + av,
                dataType: 'text'
            }).then((response) => {
                let cid = response.match(/cid=(\d+)&aid=/);
                if (cid && cid[1]) return p.resolve(cid[1]);
                return p.reject();
            }, () => {
                p.reject();
            });
            return p;
        };
        */

        const Essential = {
            init: () => {
                return Essential.Toast.init().then(() => {
                    return Essential.AlertDialog.init().then(() => {
                        return Essential.Config.init().then(() => {
                            Essential.DataSync.init();
                            Essential.Cache.load();
                            Essential.Config.load();
                        });
                    });
                });
            },
            Toast: {
                init: () => {
                    try {
                        const list = [];
                        window.toast = (msg, type = 'info', timeout = 4e3) => {
                            switch (type) {
                                case 'success':
                                case 'info':
                                    console.info('[' + NAME + ']' + msg);
                                    break;
                                case 'caution':
                                    console.warn('[' + NAME + ']' + msg);
                                    break;
                                case 'error':
                                    console.error('[' + NAME + ']' + msg);
                                    break;
                                default:
                                    type = 'info';
                                    console.log('[' + NAME + ']' + msg);
                            }
                            if (!CONFIG.SHOW_TOAST) return;
                            let a = $('<div class="link-toast ' + type + ' fixed"><span class="toast-text">' + msg + '</span></div>')[0];
                            document.body.appendChild(a);
                            a.style.top = document.body.scrollTop + list.length * 40 + 10 + 'px';
                            a.style.left = document.body.offsetWidth + document.body.scrollLeft - a.offsetWidth - 5 + 'px';
                            list.push(a);
                            setTimeout(() => {
                                a.className += ' out';
                                setTimeout(() => {
                                    list.shift();
                                    list.forEach((v) => {
                                        v.style.top = (parseInt(v.style.top, 10) - 40) + 'px';
                                    });
                                    a.parentNode.removeChild(a);
                                }, 200);
                            }, timeout);
                        };
                        return $.Deferred().resolve();
                    } catch (err) {
                        console.error('[' + NAME + ']初始化浮动提示时出现异常', 'error');
                        console.error(err);
                        return $.Deferred().reject();
                    }
                }
            }, // Need Init
            AlertDialog: {
                init: () => {
                    try {
                        let div_background = $('<div id="' + NAME + '_alertdialog"/>');
                        div_background[0].style = 'display: table;position: fixed;height: 100%;width: 100%;top: 0;left: 0;font-size: 12px;z-index: 10000;background-color: rgba(0,0,0,.5);';
                        let div_position = $('<div/>');
                        div_position[0].style = 'display: table-cell;vertical-align: middle;';
                        let div_style = $('<div/>');
                        div_style[0].style = 'position: relative;top: 50%;width: 40%;padding: 16px;border-radius: 5px;background-color: #fff;margin: 0 auto;';
                        div_position.append(div_style);
                        div_background.append(div_position);

                        let div_title = $('<div/>');
                        div_title[0].style = 'position: relative;padding-bottom: 12px;';
                        let div_title_span = $('<span>提示</span>');
                        div_title_span[0].style = 'margin: 0;color: #23ade5;font-size: 16px;';
                        div_title.append(div_title_span);
                        div_style.append(div_title);

                        let div_content = $('<div/>');
                        div_content[0].style = 'display: inline-block;vertical-align: top;font-size: 14px;';
                        div_style.append(div_content);

                        let div_button = $('<div/>');
                        div_button[0].style = 'position: relative;height: 32px;margin-top: 12px;';
                        div_style.append(div_button);

                        let button_ok = $('<button><span>确定</span></button>');
                        button_ok[0].style = 'position: absolute;height: 100%;min-width: 68px;right: 0;background-color: #23ade5;color: #fff;border-radius: 4px;font-size: 14px;border: 0;cursor: pointer;';
                        div_button.append(button_ok);

                        window.alertdialog = (title, content) => {
                            div_title_span.html(title);
                            div_content.html(content);
                            button_ok.click(() => {
                                $('#' + NAME + '_alertdialog').remove();
                            });
                            $('body > .link-popup-ctnr').first().append(div_background);
                        };
                        return $.Deferred().resolve();
                    } catch (err) {
                        window.toast('初始化帮助界面时出现异常', 'error');
                        console.error(err);
                        return $.Deferred().reject();
                    }
                }
            }, // Need Init After Toast.init
            Config: {
                CONFIG_DEFAULT: {
                    AUTO_SIGN: true,
                    AUTO_TREASUREBOX: true,
                    AUTO_GROUP_SIGN: true,
                    MOBILE_HEARTBEAT: true,
                    AUTO_LOTTERY: false,
                    AUTO_LOTTERY_CONFIG: {
                        GIFT_LOTTERY: true,
                        GIFT_LOTTERY_CONFIG: {
                            IGNORE_NOTICE: false,
                            DELAY_MIN: 5,
                            DELAY_MAX: 10,
                            DISCARD_RATE: 0.01,
                            IGNORE_QUESTIONABLE_LOTTERY: true
                        },
                        GUARD_AWARD: true,
                        MATERIAL_OBJECT_LOTTERY: true,
                        MATERIAL_OBJECT_LOTTERY_CONFIG: {
                            CHECK_INTERVAL: 10,
                            IGNORE_QUESTIONABLE_LOTTERY: true
                        }
                    },
                    AUTO_TASK: true,
                    AUTO_GIFT: false,
                    AUTO_GIFT_CONFIG: {
                        ROOMID: 0,
                        GIFT_DEFAULT: [1],
                        GIFT_ALLOWED: [1],
                        SEND_TODAY: false,
                        IGNORE_FEED: false
                    },
                    SILVER2COIN: false,
                    SILVER2COIN_CONFIG: {
                        USE_NEW: true,
                        USE_OLD: true
                    },
                    AUTO_DAILYREWARD: true,
                    AUTO_DAILYREWARD_CONFIG: {
                        LOGIN: true,
                        WATCH: true,
                        COIN: false,
                        COIN_CONFIG: {
                            NUMBER: 5
                        },
                        SHARE: false
                    },
                    SHOW_TOAST: true
                },
                NAME: {
                    AUTO_SIGN: '自动签到',
                    AUTO_TREASUREBOX: '自动领取银瓜子',
                    AUTO_GROUP_SIGN: '自动应援团签到',
                    MOBILE_HEARTBEAT: '移动端心跳',
                    AUTO_LOTTERY: '自动抽奖',
                    AUTO_LOTTERY_CONFIG: {
                        GIFT_LOTTERY: '礼物抽奖',
                        GIFT_LOTTERY_CONFIG: {
                            IGNORE_NOTICE: '忽略抽奖结果',
                            DELAY_MIN: '最小延时',
                            DELAY_MAX: '最大延时',
                            DISCARD_RATE: '丢弃率',
                            IGNORE_QUESTIONABLE_LOTTERY: '忽略存疑的抽奖'
                        },
                        GUARD_AWARD: '总督领奖',
                        MATERIAL_OBJECT_LOTTERY: '实物抽奖',
                        MATERIAL_OBJECT_LOTTERY_CONFIG: {
                            CHECK_INTERVAL: '检查间隔',
                            IGNORE_QUESTIONABLE_LOTTERY: '忽略存疑的抽奖'
                        }
                    },
                    AUTO_TASK: '自动完成任务',
                    AUTO_GIFT: '自动送礼物',
                    AUTO_GIFT_CONFIG: {
                        ROOMID: '房间号',
                        GIFT_DEFAULT: '默认礼物类型',
                        GIFT_ALLOWED: '允许礼物类型',
                        SEND_TODAY: '送出包裹中今天到期的礼物',
                        IGNORE_FEED: '忽略今日亲密度上限'
                    },
                    SILVER2COIN: '银瓜子换硬币',
                    SILVER2COIN_CONFIG: {
                        USE_NEW: '使用新接口',
                        USE_OLD: '使用旧接口'
                    },
                    AUTO_DAILYREWARD: '自动每日奖励(未实现)',
                    AUTO_DAILYREWARD_CONFIG: {
                        LOGIN: '登录',
                        WATCH: '观看',
                        COIN: '投币',
                        COIN_CONFIG: {
                            NUMBER: '数量'
                        },
                        SHARE: '分享'
                    },
                    SHOW_TOAST: '显示浮动提示'
                },
                PLACEHOLDER: {
                    AUTO_LOTTERY_CONFIG: {
                        GIFT_LOTTERY_CONFIG: {
                            DELAY_MIN: '单位(秒)',
                            DELAY_MAX: '单位(秒)',
                            DISCARD_RATE: '0~1的数值'
                        },
                        MATERIAL_OBJECT_LOTTERY_CONFIG: {
                            CHECK_INTERVAL: '单位(分钟)'
                        }
                    },
                    AUTO_GIFT_CONFIG: {
                        ROOMID: '为0不送礼',
                        GIFT_DEFAULT: '为空默认不送',
                        GIFT_ALLOWED: '为空允许所有'
                    }
                },
                HELP: {
                    MOBILE_HEARTBEAT: '发送移动端心跳数据包，可以完成双端观看任务',
                    AUTO_LOTTERY: '设置是否自动参加抽奖功能，包括礼物抽奖、活动抽奖、实物抽奖<br>会占用更多资源并可能导致卡顿，且有封号风险',
                    AUTO_LOTTERY_CONFIG: {
                        GIFT_LOTTERY: '包括小电视、摩天大楼、C位光环及其他可以通过送礼触发广播的抽奖',
                        GIFT_LOTTERY_CONFIG: {
                            IGNORE_NOTICE: '不提示抽奖结果，会在参加完抽奖后关闭直播间子页面',
                            DELAY_MIN: '延时参加抽奖的最小值，单位为秒',
                            DELAY_MAX: '延时参加抽奖的最大值，单位为秒',
                            DISCARD_RATE: '丢弃每个抽奖的概率，数值在0~1之间',
                            IGNORE_QUESTIONABLE_LOTTERY: '对部分礼物抽奖广播的数据存在疑问，勾选后不参加这部分抽奖'
                        },
                        MATERIAL_OBJECT_LOTTERY: '部分房间设有实物奖励抽奖，脚本使用穷举的方式检查是否有实物抽奖<br>请注意中奖后记得及时填写相关信息领取实物奖励',
                        MATERIAL_OBJECT_LOTTERY_CONFIG: {
                            CHECK_INTERVAL: '每次穷举实物抽奖活动ID的时间间隔，单位为分钟',
                            IGNORE_QUESTIONABLE_LOTTERY: '对部分实物抽奖的标题存在疑问，勾选后不参加这部分抽奖'
                        }
                    },
                    AUTO_GIFT_CONFIG: {
                        ROOMID: '送礼物的直播间ID(即地址中live.bilibili.com/后面的数字), 设置为0则不送礼',
                        GIFT_DEFAULT: () => ('设置默认送的礼物类型编号，多个请用英文逗号(,)隔开，为空则表示默认不送出礼物<br>' + Info.gift_list_str),
                        GIFT_ALLOWED: () => ('设置允许送的礼物类型编号(任何未在此列表的礼物一定不会被送出!)，多个请用英文逗号(,)隔开，为空则表示允许送出所有类型的礼物<br><br>' + Info.gift_list_str),
                        SEND_TODAY: '送出包裹中今天到期的礼物(会送出"默认礼物类型"之外的礼物，若今日亲密度已满则不送)'
                    },
                    SILVER2COIN: '用银瓜子兑换硬币(每天每个接口各能兑换一次)<br>新接口：700银瓜子兑换1个硬币<br>旧接口：1400银瓜子兑换1个硬币',
                    AUTO_DAILYREWARD: '(该功能未实现)',
                    SHOW_TOAST: '选择是否显示浮动提示，但提示信息依旧会在控制台显示'
                },
                showed: false,
                init: () => {
                    try {
                        const p = $.Deferred();
                        const getConst = (itemname, obj) => {
                            if (itemname.indexOf('-') > -1) {
                                const objname = itemname.match(/(.+?)-/)[1];
                                if (objname && obj[objname]) return getConst(itemname.replace(objname + '-', ''), obj[objname]);
                                else return undefined;
                            }
                            if (typeof obj[itemname] === 'function') return obj[itemname]();
                            return obj[itemname];
                        };
                        const recur = (cfg, element, parentname = undefined) => {
                            for (let item in cfg) {
                                let itemname;
                                if (parentname) itemname = parentname + '-' + item;
                                else itemname = item;
                                const id = NAME + '_config_' + itemname;
                                const name = getConst(itemname, Essential.Config.NAME);
                                const placeholder = getConst(itemname, Essential.Config.PLACEHOLDER);
                                let e;
                                let h;
                                if (getConst(itemname, Essential.Config.HELP)) h = $('<div class="' + NAME + '_help" id="' + id + '_help' + '" style="display: inline;"><span class="' + NAME + '_clickable">?</span></div>');
                                switch ($.type(cfg[item])) {
                                    case 'number':
                                    case 'string':
                                        e = $('<div class="' + NAME + '_setting_item"></div>');
                                        e.html('<label style="display: inline;" title="' + name + '">' + name + '<input id="' + id + '" type="text" class="' + NAME + '_input_text" placeholder="' + placeholder + '"></label>');
                                        if (h) e.append(h);
                                        element.append(e);
                                        break;
                                    case 'boolean':
                                        e = $('<div class="' + NAME + '_setting_item"></div>');
                                        e.html('<label style="display: inline;" title="' + name + '"><input id="' + id + '" type="checkbox" class="' + NAME + '_input_checkbox">' + name + '</label>');
                                        if (h) e.append(h);
                                        element.append(e);
                                        if (getConst(itemname + '_CONFIG', Essential.Config.NAME)) $('#' + id).addClass(NAME + '_control');
                                        break;
                                    case 'array':
                                        e = $('<div class="' + NAME + '_setting_item"></div>');
                                        e.html('<label style="display: inline;" title="' + name + '">' + name + '<input id="' + id + '" type="text" class="' + NAME + '_input_text" placeholder="' + placeholder + '"></label>');
                                        if (h) e.append(h);
                                        element.append(e);
                                        break;
                                    case 'object':
                                        e = $('<div id="' + id + '" style="margin: 0px 0px 8px 12px;"/>');
                                        element.append(e);
                                        recur(cfg[item], e, itemname);
                                        break;
                                }
                            }
                        };
                        runUntilSucceed(() => {
                            try {
                                if (!$('#sidebar-vm div.side-bar-cntr')[0]) return false;
                                // 加载css
                                const addCSS = (context) => {
                                    let style = document.createElement('style');
                                    style.type = 'text/css';
                                    style.innerHTML = context;
                                    document.getElementsByTagName('head')[0].appendChild(style);
                                };
                                addCSS('.' + NAME + '_clickable {font-size: 12px;color: #0080c6;cursor: pointer;text-decoration: underline;}' +
                                    '.' + NAME + '_setting_item {margin: 6px 0px;}' +
                                    '.' + NAME + '_input_checkbox {vertical-align: bottom;}' +
                                    '.' + NAME + '_input_text {margin: -2px 0 -2px 4px;padding: 0;}');
                                // 绘制右下角按钮
                                let div_button_span = $('<span>挂机助手设置</span>');
                                div_button_span[0].style = 'font-size: 12px;line-height: 16px;color: #0080c6;';
                                let div_button = $('<div/>');
                                div_button[0].style = 'cursor: pointer;text-align: center;padding: 0px;';
                                let div_side_bar = $('<div/>');
                                div_side_bar[0].style = 'width: 56px;height: 32px;overflow: hidden;position: fixed;right: 0px;bottom: 10%;padding: 4px 4px;background-color: rgb(255, 255, 255);z-index: 10001;border-radius: 8px 0px 0px 8px;box-shadow: rgba(0, 85, 255, 0.0980392) 0px 0px 20px 0px;border: 1px solid rgb(233, 234, 236);';
                                div_button.append(div_button_span);
                                div_side_bar.append(div_button);
                                $('#sidebar-vm div.side-bar-cntr').first().after(div_side_bar);
                                // 绘制设置界面
                                let div_position = $('<div/>');
                                div_position[0].style = 'display: none;position: fixed;height: 300px;width: 300px;bottom: 5%;z-index: 9999;';
                                let div_style = $('<div/>');
                                div_style[0].style = 'display: block;overflow: hidden;height: 300px;width: 300px;border-radius: 8px;box-shadow: rgba(106, 115, 133, 0.219608) 0px 6px 12px 0px;border: 1px solid rgb(233, 234, 236);background-color: rgb(255, 255, 255);';
                                div_position.append(div_style);
                                document.body.appendChild(div_position[0]);
                                // 绘制标题栏及按钮
                                let div_title = $('<div/>');
                                div_title[0].style = 'display: block;border-bottom: 1px solid #E6E6E6;height: 35px;line-height: 35px;margin: 0;padding: 0;overflow: hidden;';
                                let div_title_span = $('<span style="float: left;display: inline;padding-left: 8px;font: 700 14px/35px SimSun;">Bilibili直播间挂机助手</span>');
                                let div_title_button = $('<div/>');
                                div_title_button[0].style = 'float: right;display: inline;padding-right: 8px;';
                                let div_button_reset = $('<div style="display: inline;"><span class="' + NAME + '_clickable">重置</span></div>');
                                div_title_button.append(div_button_reset);
                                div_title.append(div_title_span);
                                div_title.append(div_title_button);
                                div_style.append(div_title);
                                // 绘制设置项内容
                                let div_context_position = $('<div/>');
                                div_context_position[0].style = 'display: block;position: absolute;top: 36px;width: 100%;height: calc(100% - 36px);';
                                let div_context = $('<div/>');
                                div_context[0].style = 'height: 100%;overflow: auto;padding: 0 12px;margin: 0px;';
                                div_context_position.append(div_context);
                                div_style.append(div_context_position);
                                recur(Essential.Config.CONFIG_DEFAULT, div_context);
                                // 设置事件
                                div_button.click(() => {
                                    if (!Essential.Config.showed) {
                                        Essential.Config.load();
                                        div_position.css('right', div_side_bar[0].clientWidth + 'px');
                                        div_position.show();
                                        div_button_span.text('点击保存设置');
                                        div_button_span.css('color', '#ff8e29');
                                    } else {
                                        Essential.Config.save();
                                        div_position.hide();
                                        div_button_span.text('挂机助手设置');
                                        div_button_span.css('color', '#0080c6');
                                    }
                                    Essential.Config.showed = !Essential.Config.showed;
                                });
                                div_button_reset.click(() => {
                                    Essential.Config.recurLoad(Essential.Config.CONFIG_DEFAULT);
                                });
                                const getItemByElement = (element) => element.id.replace(NAME + '_config_', '');
                                const getItemByHelpElement = (element) => element.id.replace(NAME + '_config_', '').replace('_help', '');
                                $('.' + NAME + '_help').click(function () {
                                    window.alertdialog('说明', getConst(getItemByHelpElement(this), Essential.Config.HELP));
                                });
                                $('.' + NAME + '_control').click(function () {
                                    if ($(this).is(':checked')) {
                                        $('#' + NAME + '_config_' + getItemByElement(this) + '_CONFIG').show();
                                    } else {
                                        $('#' + NAME + '_config_' + getItemByElement(this) + '_CONFIG').hide();
                                    }
                                });
                                p.resolve();
                                return true;
                            } catch (err) {
                                window.toast('初始化设置界面时出现异常', 'error');
                                console.error(err);
                                p.reject();
                                return true;
                            }
                        });
                        return p;
                    } catch (err) {
                        window.toast('初始化设置时出现异常', 'error');
                        console.error(err);
                        return $.Deferred().reject();
                    }
                },
                recurLoad: (cfg, parentname = undefined) => {
                    for (let item in cfg) {
                        let itemname;
                        if (parentname) itemname = parentname + '-' + item;
                        else itemname = item;
                        let e = $('#' + NAME + '_config_' + itemname);
                        if (!e[0]) continue;
                        switch ($.type(cfg[item])) {
                            case 'number':
                            case 'string':
                                e.val(cfg[item]);
                                break;
                            case 'boolean':
                                e.prop('checked', cfg[item]);
                                if (e.is(':checked')) $('#' + NAME + '_config_' + itemname + '_CONFIG').show();
                                else $('#' + NAME + '_config_' + itemname + '_CONFIG').hide();
                                break;
                            case 'array':
                                e.val(cfg[item].join(','));
                                break;
                            case 'object':
                                Essential.Config.recurLoad(cfg[item], itemname);
                                break;
                        }
                    }
                },
                recurSave: (config, parentname = undefined) => {
                    let cfg = JSON.parse(JSON.stringify(config || Essential.Config.CONFIG_DEFAULT));
                    if (Object.prototype.toString.call(cfg) !== '[object Object]') return cfg;
                    for (let item in cfg) {
                        let itemname;
                        if (parentname) itemname = parentname + '-' + item;
                        else itemname = item;
                        let e = $('#' + NAME + '_config_' + itemname);
                        if (!e[0]) continue;
                        switch ($.type(cfg[item])) {
                            case 'string':
                                cfg[item] = e.val() || '';
                                break;
                            case 'number':
                                cfg[item] = parseFloat(e.val());
                                break;
                            case 'boolean':
                                cfg[item] = e.is(':checked');
                                break;
                            case 'array':
                                const value = e.val().replace(/(\s|\u00A0)+/, '');
                                if (value === '') cfg[item] = [];
                                else cfg[item] = value.split(',');
                                cfg[item].forEach((v, i) => {
                                    cfg[item][i] = parseFloat(v);
                                });
                                break;
                            case 'object':
                                cfg[item] = Essential.Config.recurSave(cfg[item], itemname);
                                break;
                        }
                    }
                    return cfg;
                },
                load: () => {
                    CONFIG = JSON.parse(JSON.stringify(Essential.Config.CONFIG_DEFAULT));
                    try {
                        $.extend(CONFIG, JSON.parse(localStorage.getItem(NAME + '_CONFIG')));
                        if (Object.prototype.toString.call(CONFIG) !== '[object Object]') throw new Error();
                    } catch (e) {
                        CONFIG = JSON.parse(JSON.stringify(Essential.Config.CONFIG_DEFAULT));
                        localStorage.setItem(NAME + '_CONFIG', JSON.stringify(CONFIG));
                    }
                    DEBUG('Essential.Config.load: CONFIG', CONFIG);
                    Essential.Config.recurLoad(CONFIG);
                },
                save: () => {
                    CONFIG = Essential.Config.recurSave();
                    Essential.DataSync.sync();
                    DEBUG('Essential.Config.save: CONFIG', CONFIG);
                    localStorage.setItem(NAME + '_CONFIG', JSON.stringify(CONFIG));
                    window.toast('设置已保存，部分设置需要刷新后生效', 'success');
                },
                clear: () => {
                    CONFIG = JSON.parse(JSON.stringify(Essential.Config.CONFIG_DEFAULT));
                    Essential.DataSync.sync();
                    localStorage.removeItem(NAME + '_CONFIG');
                }
            }, // Need Init After Toast.init and AlertDialog.init
            Cache: {
                load: () => {
                    try {
                        CACHE = JSON.parse(localStorage.getItem(NAME + '_CACHE'));
                        if (Object.prototype.toString.call(CACHE) !== '[object Object]') throw new Error();
                    } catch (err) {
                        CACHE = {
                            last_aid: 162
                        };
                        localStorage.setItem(NAME + '_CACHE', JSON.stringify(CACHE));
                    }
                    DEBUG('Essential.Cache.load: CACHE', CACHE);
                },
                save: () => {
                    DEBUG('Essential.Cache.save: CACHE', CACHE);
                    Essential.DataSync.sync();
                    localStorage.setItem(NAME + '_CACHE', JSON.stringify(CACHE));
                }
            },
            DataSync: {
                init: () => {
                    window[NAME] = {};
                },
                sync: () => {
                    try {
                        window[NAME].Info = Info;
                        window[NAME].CONFIG = CONFIG;
                        window[NAME].CACHE = CACHE;
                        if (window[NAME].Lottery && window[NAME].Lottery.iframeList) {
                            window[NAME].Lottery.iframeList.forEach((v) => {
                                v.contentWindow[NAME].promise.sync.resolve();
                            });
                        }
                    } catch (err) {
                        window.toast('脚本数据同步时出现异常');
                        console.error(err);
                    }
                }
            }
        }; // Only Run in MainScript, Need Init after Toast.init

        const Sign = {
            run: () => {
                try {
                    if (!CONFIG.AUTO_SIGN) return;
                    API.sign.doSign().then((response) => {
                        DEBUG('Sign.run: doSign', response);
                        if (response.code === 0) {
                            // 签到成功
                            window.toast('[自动签到]' + response.data.text, 'success');
                        } else if (response.code === -500) {
                            // 今天已签到过
                        } else {
                            window.toast('[自动签到]' + response.data.text, 'caution');
                        }
                        tommorrowRun(Sign.run);
                    }, () => {
                        window.toast('[自动签到]签到失败，请检查网络', 'error');
                    });
                } catch (err) {
                    window.toast('[自动签到]运行时出现异常，已停止', 'error');
                    console.error(err);
                }
            }
        }; // Once Run every day

        const GroupSign = {
            getGroups: () => {
                return API.Group.my_groups().then((response) => {
                    if (response.code === 0) return $.Deferred().resolve(response.data.list);
                    window.toast('[自动应援团签到]' + response.msg, 'caution');
                    return $.Deferred().reject();
                }, () => {
                    window.toast('[自动应援团签到]获取应援团列表失败，请检查网络', 'error');
                });
            },
            signInList: (list, i = 0) => {
                if (i >= list.length) return $.Deferred().resolve();
                const obj = list[i];
                return API.Group.sign_in(obj.group_id, obj.owner_uid).then((response) => {
                    if (response.code === 0) {
                        if (response.data.status !== 1) {
                            window.toast('[自动应援团签到]应援团(group_id=' + obj.group_id + ',owner_uid=' + obj.owner_uid + ')签到成功，当前勋章亲密度+' + response.data.add_num, 'success');
                        }
                    } else {
                        window.toast('[自动应援团签到]' + response.msg, 'caution');
                    }
                    return GroupSign.signInList(list, i + 1);
                }, () => {
                    window.toast('[自动应援团签到]应援团(group_id=' + obj.group_id + ',owner_uid=' + obj.owner_uid + ')签到失败，请检查网络', 'error');
                    return GroupSign.signInList(list, i + 1);
                });
            },
            run: () => {
                try {
                    if (!CONFIG.AUTO_GROUP_SIGN) return;
                    GroupSign.getGroups().then((list) => {
                        GroupSign.signInList(list);
                    }).always(() => {
                        tommorrowRun(GroupSign.run);
                    });
                } catch (err) {
                    window.toast('[自动应援团签到]运行时出现异常，已停止', 'error');
                    console.error(err);
                }
            }
        }; // Once Run every day

        const Exchange = {
            run: () => {
                try {
                    if (!CONFIG.SILVER2COIN) return;
                    let p1 = $.Deferred().resolve();
                    let p2 = $.Deferred().resolve();
                    if (CONFIG.SILVER2COIN_CONFIG.USE_NEW) p1 = Exchange.silver2coin();
                    if (CONFIG.SILVER2COIN_CONFIG.USE_OLD) p2 = Exchange.silver2coin_old();
                    $.when(p1, p2).always(() => {
                        tommorrowRun(Exchange.run);
                    });
                } catch (err) {
                    window.toast('[银瓜子换硬币]运行时出现异常，已停止', 'error');
                    console.error(err);
                }
            },
            silver2coin: () => {
                return API.Exchange.silver2coin(Info.csrf_token).then((response) => {
                    DEBUG('Exchange.silver2coin: API.SilverCoinExchange.silver2coin', response);
                    if (response.code === 0) {
                        // 兑换成功
                        window.toast('[银瓜子换硬币][新接口]兑换成功', 'success');
                    } else if (response.code === 403) {
                        // 每天最多能兑换 1 个
                        // 银瓜子余额不足
                        window.toast('[银瓜子换硬币][新接口]' + response.msg, 'info');
                    } else {
                        window.toast('[银瓜子换硬币][新接口]' + response.msg, 'caution');
                    }
                }, () => {
                    window.toast('[银瓜子换硬币][新接口]兑换失败，请检查网络', 'error');
                });
            },
            silver2coin_old: () => {
                return API.Exchange.old.silver2coin(Info.csrf_token).then((response) => {
                    DEBUG('Exchange.silver2coin_old: API.SilverCoinExchange.old.silver2coin', response);
                    if (response.code === 0) {
                        // 兑换成功
                        window.toast('[银瓜子换硬币][旧接口]兑换成功', 'success');
                    } else if (response.code === -403) {
                        // 每天最多能兑换 1 个
                        // 银瓜子余额不足
                        window.toast('[银瓜子换硬币][旧接口]' + response.msg, 'info');
                    } else {
                        window.toast('[银瓜子换硬币][旧接口]' + response.msg, 'caution');
                    }
                }, () => {
                    window.toast('[银瓜子换硬币][旧接口]兑换失败，请检查网络', 'error');
                });
            }
        }; // Once Run every day

        // TODO
        /*
        const DailyReward = {
            login: () => {
                return API.DailyReward.login().then(() => {
                    window.toast('[自动每日奖励][每日登录]完成', 'success');
                }, () => {
                    window.toast('[自动每日奖励][每日登录]完成失败，请检查网络', 'error');
                });
            },
            watch: (av) => {
                return get_cid(av).then((cid) => {
                    return API.DailyReward.watch(av, cid, Info.uid, Info.csrf_token, ts_s()).then((response) => {
                        if (response.code === 0) {
                            window.toast('[自动每日奖励][每日观看]完成', 'success');
                        } else {
                            window.toast('[自动每日奖励][每日观看]' + response.msg, 'caution');
                        }
                    }, () => {
                        window.toast('[自动每日奖励][每日观看]完成失败，请检查网络', 'error');
                    });
                }, () => {
                    window.toast('[自动每日奖励][每日观看]获取视频信息失败，请检查网络', 'error');
                });
            },
            coin: (number) => {
                return API.dynamic_svr.dynamic_new(Info.uid).then((response) => {
                    if (response);
                }, () => {
                    window.toast('[自动每日奖励][每日投币]获取"动态-投稿视频"失败，请检查网络', 'error');
                });
            },
            run: () => {
                try {
                    if (!CONFIG.AUTO_DAILYREWARD) return;
                    $.when(DailyReward.login(), DailyReward.watch(28015835)).always(() => {
                        tommorrowRun(DailyReward.run);
                    });
                } catch (err) {
                    window.toast('[自动每日奖励]运行时出现异常', 'error');
                    console.error(err);
                }
            }
        }; // Once Run every day
        */
        const Task = {
            run: () => {
                try {
                    if (!CONFIG.AUTO_TASK) return;
                    if (!Info.mobile_verify) {
                        window.toast('[自动完成任务]未绑定手机，已停止', 'caution');
                        return;
                    }
                    const func = (response) => {
                        for (const key in response.data) {
                            if (typeof response.data[key] === 'object' && response.data[key].task_id && response.data[key].status === 1) {
                                // 当前对象是任务且任务可完成
                                Task.receiveAward(response.data[key].task_id);
                            }
                        }
                    };
                    window.toast('[自动完成任务]检查任务完成情况', 'info');
                    API.i.taskInfo().then(func).always(() => {
                        setTimeout(Task.run, 3600e3);
                    });
                } catch (err) {
                    window.toast('[自动完成任务]运行时出现异常，已停止', 'error');
                    console.error(err);
                }
            },
            receiveAward: (task_id) => {
                return API.activity.receive_award(task_id, Info.csrf_token).then((response) => {
                    DEBUG('Task.receiveAward: receive_award', response);
                    if (response.code === 0) {
                        // 完成任务
                        window.toast('[自动完成任务]完成任务：' + task_id, 'success');
                    } else if (response.code === -400) {
                        // 奖励已领取
                        // window.toast('[自动完成任务]' + task_id + '：' + response.msg, 'info');
                    } else {
                        window.toast('[自动完成任务]' + task_id + '：' + response.msg, 'caution');
                    }
                }, () => {
                    window.toast('[自动完成任务]完成任务失败，请检查网络', 'error');
                });
            }
        }; // Once Run every hour

        const Gift = {
            ruid: undefined,
            room_id: undefined,
            medal_list: undefined,
            bag_list: undefined,
            time: undefined,
            remain_feed: undefined,
            getMedalList: (page = 1) => {
                if (page === 1) Gift.medal_list = [];
                return API.i.medal(page, 25).then((response) => {
                    DEBUG('Gift.getMedalList: medal', response);
                    Gift.medal_list = Gift.medal_list.concat(response.data.fansMedalList);
                    if (response.data.pageinfo.curPage < response.data.pageinfo.totalpages) return Gift.getMedalList(page + 1);
                }, () => {
                    window.toast('[自动送礼]获取勋章列表失败，请检查网络', 'error');
                });
            },
            getBagList: () => {
                return API.gift.bag_list().then((response) => {
                    DEBUG('Gift.getBagList: bag_list', response);
                    Gift.bag_list = response.data.list;
                    Gift.time = response.data.time;
                }, () => {
                    window.toast('[自动送礼]获取包裹列表失败，请检查网络', 'error');
                });
            },
            getFeedByGiftID: (gift_id) => {
                for (let i = Info.gift_list.length - 1; i >= 0; --i) {
                    if (Info.gift_list[i].id === gift_id) {
                        return Math.ceil(Info.gift_list[i].price / 100);
                    }
                }
                return 0;
            },
            run: () => {
                try {
                    if (!CONFIG.AUTO_GIFT || (CONFIG.AUTO_GIFT && CONFIG.AUTO_GIFT_CONFIG.ROOMID <= 0)) return;
                    const func = () => {
                        window.toast('[自动送礼]送礼失败，请检查网络', 'error');
                    };
                    API.room.room_init(CONFIG.AUTO_GIFT_CONFIG.ROOMID).then((response) => {
                        DEBUG('Gift.run: API.room.room_init', response);
                        Gift.room_id = parseInt(response.data.room_id, 10);
                        Gift.getMedalList().then(() => {
                            DEBUG('Gift.getMedalList().then: Gift.medal_list', Gift.medal_list);
                            $.each(Gift.medal_list, (i, v) => {
                                if (parseInt(v.roomid, 10) === CONFIG.AUTO_GIFT_CONFIG.ROOMID) {
                                    Gift.ruid = v.target_id;
                                    Gift.remain_feed = v.day_limit - v.today_feed;
                                    if (!Gift.bag_list) {
                                        Gift.getBagList().then(() => {
                                            if (CONFIG.AUTO_GIFT_CONFIG.IGNORE_FEED) {
                                                window.toast('[自动送礼]忽略今日亲密度上限，送礼开始', 'info');
                                                Gift.sendGift();
                                            } else {
                                                if (Gift.remain_feed > 0) {
                                                    window.toast('[自动送礼]今日亲密度未满，送礼开始', 'info');
                                                    Gift.sendGift();
                                                } else {
                                                    window.toast('[自动送礼]今日亲密度已满', 'info');
                                                    tommorrowRun(Gift.run);
                                                }
                                            }
                                        });
                                    }
                                    return false;
                                }
                            });
                        }, func);
                    }, func);
                } catch (err) {
                    window.toast('[自动送礼]运行时出现异常，已停止', 'error');
                    console.error(err);
                }
            },
            sendGift: (i = 0) => {
                if (i >= Gift.bag_list.length) {
                    window.toast('[自动送礼]送礼结束，1小时后再次送礼', 'info');
                    setTimeout(Gift.run, 3600e3);
                    return $.Deferred().resolve();
                }
                if (Gift.remain_feed <= 0 && !CONFIG.AUTO_GIFT_CONFIG.IGNORE_FEED) {
                    window.toast('[自动送礼]送礼结束，今日亲密度已满', 'info');
                    tommorrowRun(Gift.run);
                    return $.Deferred().resolve();
                }
                if (Gift.time <= 0) Gift.time = ts_ms();
                let v = Gift.bag_list[i];
                if (($.inArray(v.gift_id, CONFIG.AUTO_GIFT_CONFIG.GIFT_ALLOWED) > -1 || !CONFIG.AUTO_GIFT_CONFIG.GIFT_ALLOWED.length) && // 检查GIFT_ALLOWED
                    ($.inArray(v.gift_id, CONFIG.AUTO_GIFT_CONFIG.GIFT_DEFAULT) > -1 || // 检查GIFT_DEFAULT
                        (CONFIG.AUTO_GIFT_CONFIG.SEND_TODAY && v.expire_at > Gift.time && v.expire_at - Gift.time < 86400))) { // 检查SEND_TODAY和礼物到期时间
                    let feed = Gift.getFeedByGiftID(v.gift_id);
                    if (feed > 0) {
                        let feed_num = Math.floor(Gift.remain_feed / feed);
                        if (feed_num > v.gift_num) feed_num = v.gift_num;
                        if (feed_num > 0) {
                            return API.gift.bag_send(Info.uid, v.gift_id, Gift.ruid, feed_num, v.bag_id, Gift.room_id, Info.rnd, Info.csrf_token, Info.visit_id).then((response) => {
                                DEBUG('Gift.sendGift: bag_send', response);
                                if (response.code === 0) {
                                    Info.rnd = response.data.rnd;
                                    Gift.remain_feed -= feed_num * feed;
                                    window.toast('[自动送礼]包裹送礼成功，送出' + feed_num + '个' + v.gift_name, 'success');
                                } else {
                                    window.toast('[自动送礼]' + response.msg, 'caution');
                                }
                                return Gift.sendGift(i + 1);
                            }, () => {
                                window.toast('[自动送礼]包裹送礼失败，请检查网络', 'error');
                                return Gift.sendGift(i + 1);
                            });
                        }
                    }
                }
                return Gift.sendGift(i + 1);
            }
        }; // Once Run every hour

        const MobileHeartbeat = {
            timer: undefined,
            run: () => {
                try {
                    if (!CONFIG.MOBILE_HEARTBEAT) return;
                    if (MobileHeartbeat.timer) clearTimeout(MobileHeartbeat.timer);
                    API.HeartBeat.mobile().always(() => {
                        MobileHeartbeat.timer = setTimeout(MobileHeartbeat.run, 300e3);
                    });
                } catch (err) {
                    window.toast('[移动端心跳]运行时出现异常，已停止', 'error');
                    console.error(err);
                }
            }
        }; // Once Run every 5mins

        const TreasureBox = {
            timer: undefined,
            promise: {
                calc: undefined,
                timer: undefined
            },
            DOM: {
                image: undefined,
                canvas: undefined,
                div_tip: undefined,
                div_timer: undefined
            },
            init: () => {
                if (!CONFIG.AUTO_TREASUREBOX) return $.Deferred().resolve();
                const p = $.Deferred();
                runUntilSucceed(() => {
                    try {
                        let treasure_box = $('#gift-control-vm div.treasure-box.p-relative');
                        if (!treasure_box.length) return false;
                        treasure_box = treasure_box.first();
                        treasure_box.attr('id', 'old_treasure_box');
                        treasure_box.hide();
                        let div = $('<div id="' + NAME + '_treasure_div" class="treasure-box p-relative" style="min-width: 46px;display: inline-block;float: left;padding: 22px 0 0 15px;"></div>');
                        TreasureBox.DOM.div_tip = $('<div id="' + NAME + '_treasure_div_tip" class="t-center b-box none-select">自动<br>领取中</div>');
                        TreasureBox.DOM.div_timer = $('<div id="' + NAME + '_treasure_div_timer" class="t-center b-box none-select">0</div>');
                        TreasureBox.DOM.image = $('<img id="' + NAME + '_treasure_image" style="display:none">');
                        TreasureBox.DOM.canvas = $('<canvas id="' + NAME + '_treasure_canvas" style="display:none" height="40" width="120"></canvas>');
                        let css_text = 'min-width: 40px;padding: 2px 3px;margin-top: 3px;font-size: 12px;color: #fff;background-color: rgba(0,0,0,.5);border-radius: 10px;';
                        TreasureBox.DOM.div_tip[0].style = css_text;
                        TreasureBox.DOM.div_timer[0].style = css_text;
                        div.append(TreasureBox.DOM.div_tip);
                        div.append(TreasureBox.DOM.image);
                        div.append(TreasureBox.DOM.canvas);
                        TreasureBox.DOM.div_tip.after(TreasureBox.DOM.div_timer);
                        treasure_box.after(div);
                        if (!Info.mobile_verify) {
                            TreasureBox.setMsg('未绑定<br>手机');
                            window.toast('[自动领取瓜子]未绑定手机，已停止', 'caution');
                            p.resolve();
                            return true;
                        }
                        try {
                            if (OCRAD);
                        } catch (err) {
                            TreasureBox.setMsg('初始化<br>失败');
                            window.toast('[自动领取瓜子]OCRAD初始化失败，已停止', 'error');
                            console.error(err);
                            p.resolve();
                            return true;
                        }
                        TreasureBox.timer = setInterval(() => {
                            let t = parseInt(TreasureBox.DOM.div_timer.text(), 10);
                            if (t > 0) TreasureBox.DOM.div_timer.text((t - 1) + 's');
                            else TreasureBox.DOM.div_timer.hide();
                        }, 1e3);
                        TreasureBox.DOM.image[0].onload = () => {
                            // 实现功能类似 https://github.com/zacyu/bilibili-helper/blob/master/src/bilibili_live.js 中Live.treasure.init()的验证码处理部分
                            let ctx = TreasureBox.DOM.canvas[0].getContext('2d');
                            ctx.font = '40px agencyfbbold';
                            ctx.textBaseline = 'top';
                            ctx.clearRect(0, 0, TreasureBox.DOM.canvas[0].width, TreasureBox.DOM.canvas[0].height);
                            ctx.drawImage(TreasureBox.DOM.image[0], 0, 0);
                            let grayscaleMap = TreasureBox.captcha.OCR.getGrayscaleMap(ctx);
                            let filterMap = TreasureBox.captcha.OCR.orderFilter2In3x3(grayscaleMap);
                            ctx.clearRect(0, 0, 120, 40);
                            for (let i = 0; i < filterMap.length; ++i) {
                                let gray = filterMap[i];
                                ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
                                ctx.fillRect(i % 120, Math.round(i / 120), 1, 1);
                            }
                            try {
                                let question = TreasureBox.captcha.correctQuestion(OCRAD(ctx.getImageData(0, 0, 120, 40)));
                                DEBUG('TreasureBox.DOM.image.load', 'question =', question);
                                let answer = TreasureBox.captcha.eval(question);
                                DEBUG('TreasureBox.DOM.image.load', 'answer =', answer);
                                if (answer !== undefined) {
                                    // window.toast('[自动领取瓜子]验证码识别结果：' + question + ' = ' + answer, 'info');
                                    console.info('[Bilibili直播间挂机助手][自动领取瓜子]验证码识别结果：' + question + ' = ' + answer);
                                    TreasureBox.promise.calc.resolve(answer);
                                }
                            } catch (err) {
                                TreasureBox.promise.calc.reject();
                            }
                        };
                        p.resolve();
                        return true;
                    } catch (err) {
                        window.toast('[自动领取瓜子]初始化时出现异常，已停止', 'error');
                        console.error(err);
                        p.reject();
                        return true;
                    }
                });
                return p;
            },
            run: () => {
                try {
                    if (!CONFIG.AUTO_TREASUREBOX || !TreasureBox.timer) return;
                    TreasureBox.getCurrentTask().then((response) => {
                        if (response.code === 0) {
                            // 获取任务成功
                            TreasureBox.promise.timer = $.Deferred();
                            TreasureBox.promise.timer.then(() => {
                                TreasureBox.captcha.calc().then((captcha) => {
                                    // 验证码识别完成
                                    TreasureBox.getAward(captcha).then(() => {
                                        TreasureBox.run();
                                    }); // 领取成功
                                });
                            });
                            let t = response.data.time_end - ts_s() + 1;
                            if (t < 0) t = 0;
                            setTimeout(() => {
                                if (TreasureBox.promise.timer) TreasureBox.promise.timer.resolve();
                            }, t * 1e3);
                            TreasureBox.DOM.div_timer.text(t + 's');
                            TreasureBox.DOM.div_timer.show();
                            TreasureBox.DOM.div_tip.html('次数<br>' + response.data.times + '/' + response.data.max_times + '<br>银瓜子<br>' + response.data.silver);
                        } else if (response.code === -10017) {
                            // 今天所有的宝箱已经领完!
                            TreasureBox.setMsg('今日<br>已领完');
                            // window.toast('[自动领取瓜子]' + response.msg, 'info');
                            tommorrowRun(TreasureBox.run);
                        } else {
                            window.toast('[自动领取瓜子]' + response.msg, 'caution');
                        }
                    });
                } catch (err) {
                    TreasureBox.setMsg('运行<br>异常');
                    window.toast('[自动领取瓜子]运行时出现异常，已停止', 'error');
                    console.error(err);
                }
            },
            setMsg: (htmltext) => {
                if (!CONFIG.AUTO_TREASUREBOX) return;
                if (TreasureBox.promise.timer) {
                    TreasureBox.promise.timer.reject();
                    TreasureBox.promise.timer = undefined;
                }
                TreasureBox.DOM.div_timer.hide();
                TreasureBox.DOM.div_tip.html(htmltext);
            },
            getAward: (captcha, cnt = 0) => {
                if (!CONFIG.AUTO_TREASUREBOX || cnt > 3) return $.Deferred().reject();
                return API.TreasureBox.getAward(ts_s(), ts_s(), captcha).then((response) => {
                    DEBUG('TreasureBox.getAward: getAward', response);
                    switch (response.code) {
                        case 0:
                            window.toast('[自动领取瓜子]领取了 ' + response.data.awardSilver + ' 银瓜子', 'success');
                        case -903: // -903: 已经领取过这个宝箱
                            // window.toast('[自动领取瓜子]已经领取过这个宝箱', 'caution');
                            return $.Deferred().resolve();
                        case -902: // -902: 验证码错误
                        case -901: // -901: 验证码过期
                            return TreasureBox.captcha.calc().then((captcha) => {
                                return TreasureBox.getAward(captcha, cnt);
                            });
                        case -800: // -800：未绑定手机
                            TreasureBox.setMsg('未绑定<br>手机');
                            window.toast('[自动领取瓜子]未绑定手机，已停止', 'caution');
                            return $.Deferred().reject();
                        case -500: // -500：领取时间未到, 请稍后再试
                            const p = $.Deferred();
                            setTimeout(() => {
                                TreasureBox.captcha.calc().then((captcha) => {
                                    TreasureBox.getAward(captcha, cnt + 1).then(() => p.resolve(), () => p.reject());
                                }, () => p.reject());
                            }, 3e3);
                            return p;
                        case 400: // 400: 访问被拒绝
                            TreasureBox.setMsg('拒绝<br>访问');
                            window.toast('[自动领取瓜子]访问被拒绝，您的帐号可能已经被封禁，已停止', 'error');
                            return $.Deferred().reject();
                        default: // 其他错误
                            window.toast('[自动领取瓜子]' + response.msg, 'caution');
                            return $.Deferred().reject();
                    }
                }, () => {
                    window.toast('[自动领取瓜子]获取任务失败，请检查网络', 'error');
                });
            },
            getCurrentTask: () => {
                if (!CONFIG.AUTO_TREASUREBOX) return $.Deferred().reject();
                return API.TreasureBox.getCurrentTask().then((response) => {
                    DEBUG('TreasureBox.getCurrentTask: getCurrentTask', response);
                    return $.Deferred().resolve(response);
                }, () => {
                    window.toast('[自动领取瓜子]获取当前任务失败，请检查网络', 'error');
                });
            },
            captcha: {
                cnt: 0,
                calc: () => {
                    if (!CONFIG.AUTO_TREASUREBOX) {
                        TreasureBox.captcha.cnt = 0;
                        return $.Deferred().reject();
                    }
                    TreasureBox.captcha.cnt++;
                    if (TreasureBox.captcha.cnt > 100) { // 允许验证码无法识别的次数
                        // 验证码识别失败
                        TreasureBox.setMsg('验证码<br>识别<br>失败');
                        window.toast('[自动领取瓜子]验证码识别失败，已停止', 'error');
                        return $.Deferred().reject();
                    }
                    return API.TreasureBox.getCaptcha(ts_ms()).then((response) => {
                        DEBUG('TreasureBox.captcha.calc: getCaptcha', response);
                        if (response.code === 0) {
                            const p = $.Deferred();
                            TreasureBox.promise.calc = $.Deferred();
                            TreasureBox.promise.calc.then((captcha) => {
                                TreasureBox.captcha.cnt = 0;
                                p.resolve(captcha);
                            }, () => {
                                TreasureBox.captcha.calc().then((captcha) => {
                                    p.resolve(captcha);
                                }, () => {
                                    p.reject();
                                });
                            });
                            TreasureBox.DOM.image.attr('src', response.data.img);
                            return p;
                        } else {
                            window.toast('[自动领取瓜子]' + response.msg, 'caution');
                            window.toast('[自动领取瓜子]加载验证码失败，已停止', 'error');
                        }
                    }, () => {
                        window.toast('[自动领取瓜子]加载验证码失败，请检查网络', 'error');
                    });
                },
                // 对B站验证码进行处理
                // 代码来源：https://github.com/zacyu/bilibili-helper/blob/master/src/bilibili_live.js
                // 删除了未使用的变量
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
                    orderFilter2In3x3: (grayscaleMap, n = 9, width = 120) => {
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
                            // const [x, y] = [i % 120, Math.round(i / 120)];
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
                // 修正OCRAD识别结果
                // 代码来源：https://github.com/zacyu/bilibili-helper/blob/master/src/bilibili_live.js
                // 修改部分：
                // 1.将correctStr声明在correctQuestion函数内部，并修改相关引用
                // 2.在correctStr中增加'>': 3
                correctStr: {
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
                },
                correctQuestion: (question) => {
                    let q = '';
                    question = question.trim();
                    for (let i in question) {
                        let a = TreasureBox.captcha.correctStr[question[i]];
                        q += (a !== undefined ? a : question[i]);
                    }
                    if (q[2] === '4') q[2] = '+';
                    return q;
                }
            }
        }; // Constantly Run, Need Init

        const Lottery = {
            ws: undefined,
            Guard: {
                run: (roomid) => {
                    try {
                        return API.Lottery.Guard.check(roomid).then((response) => {
                            DEBUG('Lottery.Guard.run: API.Lottery.Guard.check', response);
                            if (response.code === 0 && response.data.hasOwnProperty('guard')) {
                                return Lottery.Guard.join(roomid, response.data.guard);
                            } else {
                                window.toast('[自动抽奖][总督领奖](roomid=' + roomid + ')' + response.msg, 'caution');
                            }
                        }, () => {
                            window.toast('[自动抽奖][总督领奖]检查直播间(' + roomid + ')失败，请检查网络', 'error');
                        });
                    } catch (err) {
                        window.toast('[自动抽奖][总督领奖]运行时出现异常', 'error');
                        console.error(err);
                    }
                    return $.Deferred().reject();
                },
                join: (roomid, guard, i = 0) => {
                    if (i >= guard.length) return $.Deferred().resolve();
                    const obj = guard[i];
                    if (obj.status === 1) {
                        return API.Lottery.Guard.join(roomid, obj.id, Info.csrf_token).then((response) => {
                            DEBUG('Lottery.Guard.join: API.Lottery.Guard.join', response);
                            if (response.code === 0) {
                                window.toast('[自动抽奖][总督领奖]领取(roomid=' + roomid + ',id=' + obj.id + ')成功', 'success');
                                window.toast(response.data.message, 'success');
                            } else {
                                window.toast('[自动抽奖][总督领奖](roomid=' + roomid + ',id=' + obj.id + ')' + response.msg, 'caution');
                            }
                            return Lottery.Guard.join(roomid, guard, i + 1);
                        }, () => {
                            window.toast('[自动抽奖][总督领奖]领取(roomid=' + roomid + ',id=' + obj.id + ')失败，请检查网络', 'error');
                            return Lottery.Guard.join(roomid, guard, i + 1);
                        });
                    }
                    return $.Deferred().resolve();
                }
            },
            MaterialObject: {
                list: [],
                ignore_keyword: ['test', 'encrypt', '测试', '钓鱼', '加密', '炸鱼'],
                run: () => {
                    try {
                        return Lottery.MaterialObject.check().then((aid) => {
                            // aid有效
                            CACHE.last_aid = aid;
                            Essential.Cache.save();
                        }).always(() => {
                            const p = $.Deferred();
                            p.then(() => Lottery.MaterialObject.run());
                            setTimeout(() => {
                                p.resolve();
                            }, CONFIG.AUTO_LOTTERY_CONFIG.MATERIAL_OBJECT_LOTTERY_CONFIG.CHECK_INTERVAL * 60e3 || 600e3);
                        });
                    } catch (err) {
                        window.toast('[自动抽奖][实物抽奖]运行时出现异常', 'error');
                        console.error(err);
                    }
                    return $.Deferred().reject();
                },
                check: (aid, valid = false) => {
                    aid = parseInt(aid || (CACHE.last_aid + 1), 10);
                    DEBUG('Lottery.MaterialObject.check: aid:', aid);
                    return API.Lottery.MaterialObject.getStatus(aid).then((response) => {
                        if (response.code === 0) {
                            CACHE.last_aid = aid;
                            Essential.Cache.save();
                            if (CONFIG.AUTO_LOTTERY_CONFIG.MATERIAL_OBJECT_LOTTERY_CONFIG.IGNORE_QUESTIONABLE_LOTTERY && Lottery.MaterialObject.ignore_keyword.some(v => response.data.title.toLowerCase().indexOf(v) > -1)) {
                                window.toast('[自动抽奖][实物抽奖]忽略抽奖(aid=' + aid + ')', 'caution');
                                return Lottery.MaterialObject.check(aid + 1, true);
                            } else {
                                return Lottery.MaterialObject.join(aid, response.data.title, response.data.typeB).then(() => Lottery.MaterialObject.check(aid + 1, true), () => Lottery.MaterialObject.check(aid + 1, true));
                            }
                        } else {
                            if (valid) {
                                return $.Deferred().resolve(aid - 1);
                            } else {
                                return Lottery.MaterialObject.check(aid - 1, valid);
                            }
                        }
                    }, () => {
                        window.toast('[自动抽奖][实物抽奖]检查抽奖(aid=' + aid + ')失败，请检查网络', 'error');
                    });
                },
                join: (aid, title, typeB, i = 0) => {
                    if (i >= typeB.length) return $.Deferred().resolve();
                    if (Lottery.MaterialObject.list.some(v => v.aid === aid && v.number === i + 1)) return Lottery.MaterialObject.join(aid, title, typeB, i + 1);
                    const number = i + 1;
                    const obj = {
                        title: title,
                        aid: aid,
                        number: number,
                        status: typeB[i].status,
                        join_start_time: typeB[i].join_start_time,
                        join_end_time: typeB[i].join_end_time
                    };
                    switch (obj.status) {
                        case -1: // 未开始
                            {
                                Lottery.MaterialObject.list.push(obj);
                                let p = $.Deferred();
                                p.then(() => {
                                    return Lottery.MaterialObject.draw(obj);
                                });
                                setTimeout(() => {
                                    p.resolve();
                                }, (obj.join_start_time - ts_s() + 1) * 1e3);
                            }
                            break;
                        case 0: // 可参加
                            return Lottery.MaterialObject.draw(obj).then(() => {
                                return Lottery.MaterialObject.join(aid, title, typeB, i + 1);
                            });
                        case 1: // 已参加
                            {
                                Lottery.MaterialObject.list.push(obj);
                                const p = $.Deferred();
                                p.then(() => {
                                    return Lottery.MaterialObject.notice(obj);
                                });
                                setTimeout(() => {
                                    p.resolve();
                                }, (obj.join_end_time - ts_s() + 1) * 1e3);
                            }
                            break;
                    }
                    return Lottery.MaterialObject.join(aid, title, typeB, i + 1);
                },
                draw: (obj) => {
                    return API.Lottery.MaterialObject.draw(obj.aid, obj.number).then((response) => {
                        if (response.code === 0) {
                            $.each(Lottery.MaterialObject.list, (i, v) => {
                                if (v.aid === obj.aid && v.number === obj.number) {
                                    v.status = 1;
                                    Lottery.MaterialObject.list[i] = v;
                                    return false;
                                }
                            });
                            const p = $.Deferred();
                            p.then(() => {
                                return Lottery.MaterialObject.notice(obj);
                            });
                            setTimeout(() => {
                                p.resolve();
                            }, (obj.join_end_time - ts_s() + 1) * 1e3);
                        } else {
                            window.toast('[自动抽奖][实物抽奖]"' + obj.title + '"(aid=' + obj.aid + ',number=' + obj.number + ')' + response.msg, 'caution');
                        }
                    }, () => {
                        window.toast('[自动抽奖][实物抽奖]参加"' + obj.title + '"(aid=' + obj.aid + ',number=' + obj.number + ')失败，请检查网络', 'error');
                    });
                },
                notice: (obj) => {
                    return API.Lottery.MaterialObject.getWinnerGroupInfo(obj.aid, obj.number).then((response) => {
                        if (response.code === 0) {
                            $.each(Lottery.MaterialObject.list, (i, v) => {
                                if (v.aid === obj.aid && v.number === obj.number) {
                                    v.status = 3;
                                    Lottery.MaterialObject.list[i] = v;
                                    return false;
                                }
                            });
                            $.each(response.data.winnerList, (i, v) => {
                                if (v.uid === Info.uid) {
                                    window.toast('[自动抽奖][实物抽奖]抽奖"' + obj.title + '"(aid=' + obj.aid + ',number=' + obj.number + ')获得奖励"' + v.giftTitle + '"', 'info');
                                    return false;
                                }
                            });
                        } else {
                            window.toast('[自动抽奖][实物抽奖]抽奖"' + obj.title + '"(aid=' + obj.aid + ',number=' + obj.number + ')' + response.msg, 'caution');
                        }
                    }, () => {
                        window.toast('[自动抽奖][实物抽奖]获取抽奖"' + obj.title + '"(aid=' + obj.aid + ',number=' + obj.number + ')中奖名单失败，请检查网络', 'error');
                    });
                }
            },
            create: (roomid) => {
                // roomid过滤，防止创建多个同样roomid的iframe
                if (window[NAME].Lottery.iframeList.some(v => v.contentWindow[NAME].roomid === roomid)) return;
                const iframe = $('<iframe></iframe>')[0];
                iframe.src = '//live.bilibili.com/' + roomid + '?visit_id=' + Info.visit_id;
                document.body.appendChild(iframe);
                const p = $.Deferred();
                p.then(() => {
                    $.each(window[NAME].Lottery.iframeList, (i, v) => {
                        if (v.contentWindow[NAME].roomid === roomid) {
                            document.body.removeChild(v);
                            window[NAME].Lottery.iframeList.splice(i, 1);
                            return false;
                        }
                    });
                });
                iframe.contentWindow[NAME] = {
                    roomid: roomid,
                    promise: {
                        finish: p, // 这个Promise在iframe需要删除时resolve
                        sync: $.Deferred() // 这个Promise在子脚本的CONIG、CACHE、Info等需要重新读取时resolve
                    }
                };
                window[NAME].Lottery.iframeList.push(iframe);
                DEBUG('Lottery.create: iframe', iframe);
            },
            run: () => {
                try {
                    if (!CONFIG.AUTO_LOTTERY) return;
                    window[NAME].Lottery = {
                        stop: false, // 标记是否停止抽奖
                        iframeList: [] // 记录已经创建的iframe
                    };
                    let last_roomid, last_roomid_timer;
                    Lottery.ws = new API.DanmuWebSocket(Info.uid, Info.roomid);
                    Lottery.ws.bind((ws) => {
                        Lottery.ws = ws;
                        window.toast('[自动抽奖]弹幕服务器连接断开，已重连', 'caution');
                    }, () => {
                        window.toast('[自动抽奖]连接弹幕服务器成功', 'success');
                    }, undefined, (obj) => {
                        switch (obj.cmd) {
                            case 'SYS_MSG':
                                if (window[NAME].Lottery.stop || obj.real_roomid === undefined) break;
                                if (CONFIG.AUTO_LOTTERY_CONFIG.GIFT_LOTTERY_CONFIG.IGNORE_QUESTIONABLE_LOTTERY) {
                                    if (obj.broadcast_type === 1) break;
                                }
                                // 监听策略：以下情况开始尝试创建一个iframe
                                // 1) 本次roomid与上一次的roomid不同时
                                // 2) 5s内没有收到新的SYS_MSG
                                if (last_roomid_timer) clearTimeout(last_roomid_timer);
                                if (obj.real_roomid !== last_roomid && last_roomid !== undefined) {
                                    Lottery.create(last_roomid);
                                    last_roomid = obj.real_roomid;
                                }
                                last_roomid_timer = setTimeout(() => {
                                    Lottery.create(obj.real_roomid);
                                    last_roomid_timer = undefined;
                                }, 5e3);
                                break;
                            case 'GUARD_MSG':
                                if (obj.roomid === undefined) break;
                                Lottery.Guard.run(obj.roomid);
                                break;
                            case 'GUARD_BUY':
                                Lottery.Guard.run(Info.roomid);
                                break;
                            case 'RAFFLE_START':
                                if (window[NAME].Lottery.stop) break;
                                API.Lottery.Gift.join(Info.roomid, obj.data.raffleId, Info.csrf_token, Info.visit_id).then((response) => {
                                    switch (response.code) {
                                        case 0:
                                            window.toast('[自动抽奖][礼物抽奖]已参加抽奖(roomid=' + Info.roomid + ',raffleId=' + obj.data.raffleId + ')', 'success');
                                            break;
                                        case 400:
                                            window[NAME].Lottery.stop = true;
                                            window.toast('[自动抽奖][礼物抽奖]访问被拒绝，您的帐号可能已经被封禁，已停止', 'error');
                                            break;
                                        case 402:
                                            // 抽奖已过期，下次再来吧
                                            break;
                                        case 65531:
                                            // 65531: 非当前直播间或短ID直播间试图参加抽奖
                                            window[NAME].Lottery.stop = true;
                                            window.toast('[自动抽奖][礼物抽奖]参加抽奖(roomid=' + Info.roomid + ',raffleId=' + obj.data.raffleId + ')失败，已停止', 'error');
                                            break;
                                        default:
                                            window.toast('[自动抽奖][礼物抽奖]参加抽奖(roomid=' + Info.roomid + ',raffleId=' + obj.data.raffleId + ')' + response.msg, 'caution');
                                    }
                                }, () => {
                                    window.toast('[自动抽奖][礼物抽奖]参加抽奖(roomid=' + Info.roomid + ',raffleId=' + obj.data.raffleId + ')失败，请检查网络', 'error');
                                });
                                break;
                            case 'RAFFLE_END':
                                if (window[NAME].Lottery.stop) break;
                                API.Lottery.Gift.notice(obj.data.raffleId, obj.data.type).then((response) => {
                                    DEBUG('Lottery.Gift.notice: API.Lottery.Gift.notice', response);
                                    if (response.code === 0) {
                                        switch (response.data.status) {
                                            case 1:
                                                // 非常抱歉，您错过了此次抽奖，下次记得早点来哦
                                                break;
                                            case 2:
                                                if (response.data.gift_id === '-1' && !response.data.gift_name) {
                                                    window.toast('[自动抽奖][礼物抽奖]抽奖(roomid=' + Info.roomid + ',raffleId=' + obj.data.raffleId + ')结果：' + response.msg, 'info');
                                                } else {
                                                    window.toast('[自动抽奖][礼物抽奖]抽奖(roomid=' + Info.roomid + ',raffleId=' + obj.data.raffleId + ')结果：' + response.data.gift_name + '*' + response.data.gift_num, 'info');
                                                }
                                                break;
                                            case 3:
                                                // 还未开奖
                                                break;
                                            default:
                                                window.toast('[自动抽奖][礼物抽奖]抽奖(roomid=' + Info.roomid + ',raffleId=' + obj.data.raffleId + ')结果：' + response.msg, 'caution');
                                        }
                                    } else {
                                        // 其他情况
                                        window.toast('[自动抽奖][礼物抽奖]抽奖(roomid=' + Info.roomid + ',raffleId=' + obj.data.raffleId + ')' + response.msg, 'caution');
                                    }
                                }, () => {
                                    window.toast('[自动抽奖][礼物抽奖]获取抽奖(roomid=' + Info.roomid + ',raffleId=' + obj.data.raffleId + ')结果失败，请检查网络');
                                });
                                break;
                            case 'SPECIAL_GIFT':
                                if (obj.data['39'] !== undefined) {
                                    switch (obj.data['39'].action) {
                                        case 'start':
                                            // 节奏风暴开始
                                        case 'end':
                                            // 节奏风暴结束
                                    }
                                };
                            default:
                        }
                    });
                    if (CONFIG.AUTO_LOTTERY_CONFIG.MATERIAL_OBJECT_LOTTERY) Lottery.MaterialObject.run();
                } catch (err) {
                    window.toast('[自动抽奖]运行时出现异常，已停止', 'error');
                    console.error(err);
                }
            }
        }; // Constantly Run

        const Init = () => {
            try {
                const promiseInit = $.Deferred();
                Essential.init().then(() => {
                    window.toast('正在初始化脚本...', 'info');
                    const InitData = () => {
                        const p = $.Deferred();
                        runUntilSucceed(() => {
                            try {
                                DEBUG('Init: InitData: BilibiliLive', window.BilibiliLive);
                                if (!window.BilibiliLive || parseInt(window.BilibiliLive.ROOMID, 10) === 0 || !window.__statisObserver) return false;
                                if (parseInt(window.BilibiliLive.UID, 10) === 0) {
                                    window.toast('你还没有登录，助手无法使用！', 'caution');
                                    p.reject();
                                    return true;
                                }
                                const getCookie = (name) => {
                                    let arr;
                                    const reg = new RegExp('(^| )' + name + '=([^;]*)(;|$)');
                                    if ((arr = document.cookie.match(reg))) {
                                        return unescape(arr[2]);
                                    } else {
                                        return null;
                                    }
                                };
                                Info.short_id = window.BilibiliLive.SHORT_ROOMID;
                                Info.roomid = window.BilibiliLive.ROOMID;
                                Info.uid = window.BilibiliLive.UID;
                                Info.ruid = window.BilibiliLive.ANCHOR_UID;
                                Info.rnd = window.BilibiliLive.RND;
                                Info.csrf_token = getCookie('bili_jct');
                                Info.visit_id = window.__statisObserver.__visitId;
                                const p1 = API.live_user.get_info_in_room(Info.roomid).then((response) => {
                                    DEBUG('InitData: get_info_in_room', response);
                                    Info.silver = response.data.wallet.silver;
                                    Info.gold = response.data.wallet.gold;
                                    Info.mobile_verify = response.data.info.mobile_verify;
                                    Info.identification = response.data.info.identification;
                                });
                                const p2 = API.gift.gift_config().then((response) => {
                                    DEBUG('InitData: gift_config', response);
                                    Info.gift_list = response.data;
                                    Info.gift_list.forEach((v, i) => {
                                        if (i % 3 === 0) Info.gift_list_str += '<br>';
                                        Info.gift_list_str += v.id + '：' + v.name;
                                        if (i < Info.gift_list.length - 1) Info.gift_list_str += '，';
                                    });
                                });
                                $.when(p1, p2).then(() => {
                                    Essential.DataSync.sync();
                                    p.resolve();
                                }, () => {
                                    window.toast('初始化用户数据、直播间数据失败', 'error');
                                    p.reject();
                                });
                                return true;
                            } catch (err) {
                                window.toast('初始化用户数据、直播间数据时出现异常', 'error');
                                console.error(err);
                                p.reject();
                                return true;
                            }
                        }, 1, 500);
                        return p;
                    };
                    const InitFunctions = () => {
                        const promiseInitFunctions = $.Deferred();
                        $.when(TreasureBox.init()).then(() => promiseInitFunctions.resolve(), () => promiseInitFunctions.reject());
                        return promiseInitFunctions;
                    };
                    InitData().then(() => {
                        InitFunctions().then(() => {
                            promiseInit.resolve();
                        }, () => promiseInit.reject());
                    }, () => promiseInit.reject());
                });
                return promiseInit;
            } catch (err) {
                window.toast('初始化时出现异常', 'error');
                console.error(err);
                return $.Deferred().reject();
            }
        };

        const Run = () => {
            // 每天一次
            if (CONFIG.AUTO_SIGN) Sign.run();
            if (CONFIG.AUTO_GROUP_SIGN) GroupSign.run();
            if (CONFIG.SILVER2COIN) Exchange.run();
            // if (CONFIG.AUTO_DAILYREWARD) DailyReward.run(); // TODO
            // 每过一定时间一次
            if (CONFIG.AUTO_TASK) Task.run();
            if (CONFIG.AUTO_GIFT) Gift.run();
            if (CONFIG.MOBILE_HEARTBEAT) MobileHeartbeat.run();
            // 持续运行
            if (CONFIG.AUTO_TREASUREBOX) TreasureBox.run();
            if (CONFIG.AUTO_LOTTERY) Lottery.run();
        };

        $(document).ready(() => {
            Init().then(Run);
        });
    }
})();