// ==UserScript==
// @name         Bilibili-API
// @namespace    SeaLoong
// @version      1.0.10
// @description  BilibiliAPI，PC端抓包研究所得
// @author       SeaLoong
// @require      http://code.jquery.com/jquery-3.3.1.min.js
// @license      MIT License
// ==/UserScript==

var BilibiliAPI = {
    // 整合常用API
    SilverBox: {
        getAward: function(time_start, end_time, captcha) {
            return BilibiliAPI.lottery.getAward(time_start, end_time, captcha);
        },
        getCaptcha: function(ts) {
            return BilibiliAPI.lottery.getCaptcha(ts);
        },
        getCurrentTask: function() {
            return BilibiliAPI.lottery.getCurrentTask();
        }
    },
    SilverCoinExchange: {
        coin2silver_old: function(coin) {
            return BilibiliAPI.coin2silver(coin);
        },
        coin2silver: function(num, csrf_token, platform) {
            return BilibiliAPI.pay.coin2silver(num, csrf_token, platform);
        },
        silver2coin: function(csrf_token, platform) {
            return BilibiliAPI.pay.silver2coin(csrf_token, platform);
        }
    },
    SmallTV: {
        check: function(roomid) {
            return BilibiliAPI.gift.smalltv.check(roomid);
        },
        join: function(roomid, raffleId) {
            return BilibiliAPI.gift.smalltv.join(roomid, raffleId);
        },
        notice: function(roomid, raffleId) {
            return BilibiliAPI.gift.smalltv.notice(roomid, raffleId);
        }
    },
    Raffle: {
        check: function(roomid) {
            return BilibiliAPI.activity.check(roomid);
        },
        join: function(roomid, raffleId) {
            return BilibiliAPI.activity.join(roomid, raffleId);
        },
        notice: function(roomid, raffleId) {
            return BilibiliAPI.activity.notice(roomid, raffleId);
        }
    },
    // ajax调用B站API
    last_ajax: 0,
    cnt_frequently_ajax: 0,
    ajax: function(settings) {
        if (Date.now() - BilibiliAPI.last_ajax < 10) {
            BilibiliAPI.cnt_frequently_ajax++;
        } else {
            BilibiliAPI.cnt_frequently_ajax = 0;
        }
        BilibiliAPI.last_ajax = Date.now();
        if (BilibiliAPI.cnt_frequently_ajax > 10) throw new Error('调用Bilibili API太快，可能出现了bug');
        if (settings.xhrFields) {
            jQuery.extend(settings.xhrFields, {
                withCredentials: true
            });
        } else {
            settings.xhrFields = {
                withCredentials: true
            };
        }
        jQuery.extend(settings, {
            url: (settings.url.substr(0, 2) === '//' ? '' : '//api.live.bilibili.com/') + settings.url,
            type: settings.type || 'GET',
            crossDomain: true,
            dataType: settings.dataType || 'json'
        });
        return jQuery.ajax(settings);
    },
    // 以下按照URL分类
    ajaxGetCaptchaKey: function() {
        return BilibiliAPI.ajax({
            url: '//www.bilibili.com/plus/widget/ajaxGetCaptchaKey.php?js'
        });
    },
    msg: function(roomid, csrf_token) {
        return BilibiliAPI.ajax({
            type: 'POST',
            url: 'ajax/msg',
            data: {
                roomid: roomid,
                csrf_token: typeof csrf_token === 'function' ? csrf_token() : csrf_token
            }
        });
    },
    ajaxCapsule: function(id, ts, platform, player_type) {
        return BilibiliAPI.ajax({
            url: 'api/ajaxCapsule'
        });
    },
    player: function(id, ts, platform, player_type) {
        return BilibiliAPI.ajax({
            url: 'api/player',
            data: {
                id: id,
                ts: ts, // HEX
                platform: platform || 'pc',
                player_type: player_type || 'web'
            },
            dataType: 'text'
        });
    },
    create: function(width, height) {
        // 生成一个验证码(用于节奏风暴)
        return BilibiliAPI.ajax({
            url: 'captcha/v1/Captcha/create',
            data: {
                width: width || '112',
                height: height || '32',
                _: Date.now()
            }
        });
    },
    topList: function(roomid, page, ruid) {
        return BilibiliAPI.ajax({
            url: 'guard/topList',
            data: {
                roomid: roomid,
                page: page,
                ruid: ruid
            }
        });
    },
    getSuser: function() {
        return BilibiliAPI.ajax({
            url: 'msg/getSuser'
        });
    },
    refresh: function(area) {
        return BilibiliAPI.ajax({
            url: 'index/refresh?area=' + area || 'all'
        });
    },
    get_ip_addr: function() {
        return BilibiliAPI.ajax({
            url: 'ip_service/v1/ip_service/get_ip_addr'
        });
    },
    ajaxGetMyMedalList: function() {
        return BilibiliAPI.ajax({
            url: '//live.bilibili.com/i/ajaxGetMyMedalList'
        });
    },
    getuserinfo: function() {
        return BilibiliAPI.ajax({
            url: '//live.bilibili.com/user/getuserinfo'
        });
    },
    coin2silver: function(coin) {
        // 硬币兑换银瓜子(旧API)，1硬币=900银瓜子
        return BilibiliAPI.ajax({
            type: 'POST',
            url: '//live.bilibili.com/exchange/coin2silver',
            data: {
                coin: coin
            }
        });
    },
    MyInfo: function() {
        return BilibiliAPI.ajax({
            url: '//space.bilibili.com/ajax/member/MyInfo'
        });
    },
    activity: {
        mobileActivity: function() {
            return BilibiliAPI.ajax({
                url: 'activity/v1/Common/mobileActivity'
            });
        },
        roomInfo: function(roomid, ruid) {
            return BilibiliAPI.ajax({
                url: 'activity/v1/Common/roomInfo',
                data: {
                    roomid: roomid,
                    ruid: ruid
                }
            });
        },
        welcomeInfo: function(roomid) {
            return BilibiliAPI.ajax({
                url: 'activity/v1/Common/welcomeInfo?roomid=' + roomid
            });
        },
        master_invite_task: function() {
            return BilibiliAPI.ajax({
                url: 'activity/v1/invite/master_invite_task'
            });
        },
        check: function(roomid) {
            // 检查是否有活动抽奖
            return BilibiliAPI.ajax({
                url: 'activity/v1/Raffle/check?roomid=' + roomid
            });
        },
        join: function(roomid, raffleId) {
            // 参加活动抽奖
            return BilibiliAPI.ajax({
                url: 'activity/v1/Raffle/join',
                data: {
                    roomid: roomid,
                    raffleId: raffleId
                }
            });
        },
        notice: function(roomid, raffleId) {
            // 领取活动抽奖奖励
            return BilibiliAPI.ajax({
                url: 'activity/v1/Raffle/notice',
                data: {
                    roomid: roomid,
                    raffleId: raffleId
                }
            });
        },
        master_limit_tasks: function() {
            return BilibiliAPI.ajax({
                url: 'activity/v1/task/master_limit_tasks'
            });
        },
        receive_award: function(task_id, csrf_token) {
            // 领取任务奖励
            return BilibiliAPI.ajax({
                type: 'POST',
                url: 'activity/v1/task/receive_award',
                data: {
                    task_id: task_id,
                    csrf_token: typeof csrf_token === 'function' ? csrf_token() : csrf_token
                }
            });
        },
        user_limit_tasks: function() {
            return BilibiliAPI.ajax({
                url: 'activity/v1/task/user_limit_tasks'
            });
        }
    },
    feed: {
        getList: function(page, page_size) {
            return BilibiliAPI.ajax({
                url: 'feed/v1/feed/getList',
                data: {
                    page: page,
                    page_size: page_size,
                    _: Date.now()
                }
            });
        },
        heartBeat: function(_cb) {
            return BilibiliAPI.ajax({
                url: 'feed/v1/feed/heartBeat',
                data: {
                    _cb: _cb
                }
            });
        },
        GetUserFc: function(follow) { // follow: 主播uid===ruid
            return BilibiliAPI.ajax({
                url: 'feed/v1/Feed/GetUserFc?follow=' + follow
            });
        },
        IsUserFollow: function(follow) { // follow: 主播uid===ruid
            return BilibiliAPI.ajax({
                url: 'feed/v1/Feed/IsUserFollow?follow=' + follow
            });
        },
    },
    feed_svr: {
        notice: function(csrf_token) {
            return BilibiliAPI.ajax({
                type: 'POST',
                url: 'feed_svr/v1/feed_svr/notice',
                data: {
                    csrf_token: typeof csrf_token === 'function' ? csrf_token() : csrf_token
                }
            });
        },
        my: function(page_size, csrf_token, live_status, type, offset) {
            return BilibiliAPI.ajax({
                type: 'POST',
                url: 'feed_svr/v1/feed_svr/my',
                data: {
                    live_status: live_status || 0,
                    type: type || 0,
                    page_size: page_size,
                    offset: offset || 0,
                    csrf_token: typeof csrf_token === 'function' ? csrf_token() : csrf_token
                }
            });
        }
    },
    FreeSilver: {
        getSurplus: function() {
            return BilibiliAPI.ajax({
                url: 'FreeSilver/getSurplus'
            });
        }
    },
    gift: {
        bag_list: function() {
            // 获取包裹礼物列表
            return BilibiliAPI.ajax({
                url: 'gift/v2/gift/bag_list'
            });
        },
        send: function(uid, gift_id, ruid, gift_num, coin_type, biz_id, rnd, csrf_token, platform, biz_code, storm_beat_id) {
            // 消耗瓜子送礼
            return BilibiliAPI.ajax({
                type: 'POST',
                url: 'gift/v2/gift/send',
                data: {
                    uid: uid,
                    gift_id: gift_id,
                    ruid: ruid,
                    gift_num: gift_num,
                    coin_type: coin_type || 'silver',
                    bag_id: 0,
                    platform: platform || 'pc',
                    biz_code: biz_code || 'live',
                    biz_id: biz_id, //roomid
                    rnd: rnd,
                    storm_beat_id: storm_beat_id || 0,
                    // metadata: metadata,
                    csrf_token: typeof csrf_token === 'function' ? csrf_token() : csrf_token
                }
            });
        },
        bag_send: function(uid, gift_id, ruid, gift_num, bag_id, biz_id, rnd, csrf_token, platform, biz_code, storm_beat_id) {
            // 送出包裹中的礼物
            return BilibiliAPI.ajax({
                type: 'POST',
                url: 'gift/v2/live/bag_send',
                data: {
                    uid: uid,
                    gift_id: gift_id,
                    ruid: ruid,
                    gift_num: gift_num,
                    bag_id: bag_id,
                    platform: platform || 'pc',
                    biz_code: biz_code || 'live',
                    biz_id: biz_id, //roomid
                    rnd: rnd,
                    storm_beat_id: storm_beat_id || 0,
                    // metadata: metadata,
                    csrf_token: typeof csrf_token === 'function' ? csrf_token() : csrf_token
                }
            });
        },
        heart_gift_receive: function(roomid, area_v2_id) {
            return BilibiliAPI.ajax({
                url: 'gift/v2/live/heart_gift_receive',
                data: {
                    roomid: roomid,
                    area_v2_id: area_v2_id
                }
            });
        },
        heart_gift_status: function(roomid, area_v2_id) {
            return BilibiliAPI.ajax({
                url: 'gift/v2/live/heart_gift_status',
                data: {
                    roomid: roomid,
                    area_v2_id: area_v2_id
                }
            });
        },
        receive_daily_bag: function() {
            // 领取每日礼物
            return BilibiliAPI.ajax({
                url: 'gift/v2/live/receive_daily_bag'
            });
        },
        room_gift_list: function(roomid, area_v2_id) {
            return BilibiliAPI.ajax({
                url: 'gift/v2/live/room_gift_list',
                data: {
                    roomid: roomid,
                    area_v2_id: area_v2_id
                }
            });
        },
        smalltv: {
            check: function(roomid) {
                // 检查是否有小电视
                return BilibiliAPI.ajax({
                    url: 'gift/v2/smalltv/check',
                    data: {
                        roomid: roomid
                    }
                });
            },
            join: function(roomid, raffleId) {
                // 参加小电视抽奖
                return BilibiliAPI.ajax({
                    url: 'gift/v2/smalltv/join',
                    data: {
                        roomid: roomid,
                        raffleId: raffleId
                    }
                });
            },
            notice: function(roomid, raffleId) {
                // 领取小电视抽奖奖励
                return BilibiliAPI.ajax({
                    url: 'gift/v2/smalltv/notice',
                    data: {
                        roomid: roomid,
                        raffleId: raffleId
                    }
                });
            }
        }
    },
    giftBag: {
        getSendGift: function() {
            return BilibiliAPI.ajax({
                url: 'giftBag/getSendGift'
            });
        },
        sendDaily: function() {
            return BilibiliAPI.ajax({
                url: 'giftBag/sendDaily'
            });
        }
    },
    i: {
        ajaxGetAchieve: function(page, pageSize, type, status, category, keywords) {
            return BilibiliAPI.ajax({
                url: 'i/api/ajaxGetAchieve',
                data: {
                    type: type || 'normal', // or'legend'
                    status: status || 0,
                    category: category || 'all',
                    keywords: keywords,
                    page: page,
                    pageSize: pageSize || 6
                }
            });
        },
        ajaxCancelWear: function() {
            // 取消佩戴勋章
            return BilibiliAPI.ajax({
                url: 'i/ajaxCancelWear'
            });
        },
        ajaxWearFansMedal: function(medal_id) {
            // 佩戴勋章/更换当前佩戴的勋章
            return BilibiliAPI.ajax({
                url: 'i/ajaxWearFansMedal?medal_id=' + medal_id
            });
        },
        following: function(page, pageSize) {
            return BilibiliAPI.ajax({
                url: 'i/api/following',
                data: {
                    page: page,
                    pageSize: pageSize
                }
            });
        },
        guard: function(page, pageSize) {
            return BilibiliAPI.ajax({
                url: 'i/api/guard',
                data: {
                    page: page,
                    pageSize: pageSize
                }
            });
        },
        liveinfo: function() {
            return BilibiliAPI.ajax({
                url: 'i/api/liveinfo'
            });
        },
        medal: function(page, pageSize) {
            // 获取勋章信息
            return BilibiliAPI.ajax({
                url: 'i/api/medal',
                data: {
                    page: page,
                    pageSize: pageSize
                }
            });
        },
        operation: function(page) {
            return BilibiliAPI.ajax({
                url: 'i/api/operation?page=' + page
            });
        },
        taskInfo: function() {
            return BilibiliAPI.ajax({
                url: 'i/api/taskInfo'
            });
        }
    },
    live: {
        getRoomKanBanModel: function(roomid) {
            return BilibiliAPI.ajax({
                url: 'live/getRoomKanBanModel?roomid' + roomid
            });
        },
        rankTab: function(roomid) {
            return BilibiliAPI.ajax({
                url: 'live/rankTab?roomid=' + roomid
            });
        },
        roomAdList: function() {
            return BilibiliAPI.ajax({
                url: 'live/roomAdList'
            });
        }
    },
    live_user: {
        get_anchor_in_room: function(roomid) {
            return BilibiliAPI.ajax({
                url: 'live_user/v1/UserInfo/get_anchor_in_room?roomid=' + roomid
            });
        },
        get_info_in_room: function(roomid) {
            return BilibiliAPI.ajax({
                url: 'live_user/v1/UserInfo/get_info_in_room?roomid=' + roomid
            });
        },
        get_weared_medal: function(uid, target_id, csrf_token, source) {
            return BilibiliAPI.ajax({
                type: 'POST',
                url: 'live_user/v1/UserInfo/get_weared_medal',
                data: {
                    source: source || 1,
                    uid: uid,
                    target_id: target_id, // roomid
                    csrf_token: typeof csrf_token === 'function' ? csrf_token() : csrf_token
                }
            });
        }
    },
    lottery: {
        getAward: function(time_start, end_time, captcha) {
            // 领取银瓜子
            return BilibiliAPI.ajax({
                url: 'lottery/v1/SilverBox/getAward',
                data: {
                    time_start: time_start,
                    end_time: end_time,
                    captcha: captcha
                }
            });
        },
        getCaptcha: function(ts) {
            // 获取银瓜子验证码图片
            return BilibiliAPI.ajax({
                url: 'lottery/v1/SilverBox/getCaptcha?ts=' + ts
            });
        },
        getCurrentTask: function() {
            // 获取领取银瓜子的任务
            return BilibiliAPI.ajax({
                url: 'lottery/v1/SilverBox/getCurrentTask'
            });
        },
        getRoomActivityByRoomid: function(roomid) {
            return BilibiliAPI.ajax({
                url: 'lottery/v1/box/getRoomActivityByRoomid?roomid=' + roomid
            });
        },
        check: function(roomid) {
            // 检查是否有节奏风暴
            return BilibiliAPI.ajax({
                url: 'lottery/v1/Storm/check?roomid=' + roomid
            });
        },
        join: function(id, captcha_token, captcha_phrase, csrf_token, color) {
            // 参加节奏风暴
            return BilibiliAPI.ajax({
                type: 'POST',
                url: 'lottery/v1/Storm/join',
                data: {
                    id: id,
                    color: color || 16777215,
                    captcha_token: captcha_token,
                    captcha_phrase: captcha_phrase,
                    csrf_token: typeof csrf_token === 'function' ? csrf_token() : csrf_token
                }
            });
        }
    },
    pay: {
        coin2silver: function(num, csrf_token, platform) {
            // 硬币兑换银瓜子(新API)，1硬币=450银瓜子
            return BilibiliAPI.ajax({
                type: 'POST',
                url: 'pay/v1/Exchange/coin2silver',
                data: {
                    num: num,
                    platform: platform || 'pc',
                    csrf_token: typeof csrf_token === 'function' ? csrf_token() : csrf_token
                }
            });
        },
        getRule: function(platform) {
            return BilibiliAPI.ajax({
                url: 'pay/v1/Exchange/getRule?platform=' + platform || 'pc'
            });
        },
        getStatus: function(platform) {
            return BilibiliAPI.ajax({
                url: 'pay/v1/Exchange/getStatus?platform=' + platform || 'pc'
            });
        },
        silver2coin: function(csrf_token, platform) {
            // 银瓜子兑换硬币，700银瓜子=1硬币
            return BilibiliAPI.ajax({
                type: 'POST',
                url: 'pay/v1/Exchange/silver2coin',
                data: {
                    platform: platform || 'pc',
                    csrf_token: typeof csrf_token === 'function' ? csrf_token() : csrf_token
                }
            });
        }
    },
    rankdb: {
        roomInfo: function(ruid, roomid, areaId) {
            return BilibiliAPI.ajax({
                url: 'rankdb/v1/Common/roomInfo',
                data: {
                    ruid: ruid,
                    roomid: roomid,
                    areaId: areaId
                }
            });
        }
    },
    room: {
        get_info: function(room_id, from) {
            return BilibiliAPI.ajax({
                url: 'room/v1/Room/get_info',
                data: {
                    room_id: room_id,
                    from: from || 'room'
                }
            });
        },
        playUrl: function(cid, quality, platform) {
            return BilibiliAPI.ajax({
                url: 'room/v1/Room/playUrl',
                data: {
                    cid: cid, // roomid
                    quality: quality || '0',
                    platform: platform || 'web'
                }
            });
        },
        room_entry_action: function(room_id, csrf_token, platform) {
            return BilibiliAPI.ajax({
                type: 'POST',
                url: 'room/v1/Room/room_entry_action',
                data: {
                    room_id: room_id,
                    platform: platform || 'pc',
                    csrf_token: typeof csrf_token === 'function' ? csrf_token() : csrf_token
                }
            });
        },
        room_init: function(id) {
            return BilibiliAPI.ajax({
                url: 'room/v1/Room/room_init?id=' + id
            });
        }
    },
    sign: {
        doSign: function() {
            // 签到
            return BilibiliAPI.ajax({
                url: 'sign/doSign'
            });
        },
        GetSignInfo: function() {
            // 获取签到信息
            return BilibiliAPI.ajax({
                url: 'sign/GetSignInfo'
            });
        },
        getLastMonthSignDays: function() {
            return BilibiliAPI.ajax({
                url: 'sign/getLastMonthSignDays'
            });
        }
    },
    user: {
        getWear: function(uid) {
            return BilibiliAPI.ajax({
                url: 'user/v1/user_title/getWear?uid=' + uid
            });
        },
        isBiliVip: function(uid) {
            return BilibiliAPI.ajax({
                url: 'user/v1/user/isBiliVip?uid=' + uid
            });
        },
        userOnlineHeart: function() {
            return BilibiliAPI.ajax({
                type: 'POST',
                url: 'User/userOnlineHeart'
            });
        },
        getUserInfo: function(ts) { // ms
            return BilibiliAPI.ajax({
                url: 'User/getUserInfo?ts=' + ts
            });
        }
    },
    YearWelfare: {
        checkFirstCharge: function() {
            return BilibiliAPI.ajax({
                url: 'YearWelfare/checkFirstCharge'
            });
        },
        inviteUserList: function() {
            return BilibiliAPI.ajax({
                url: 'YearWelfare/inviteUserList/1'
            });
        }
    }
};