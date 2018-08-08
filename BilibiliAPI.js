// ==UserScript==
// @name         BilibiliAPI
// @namespace    SeaLoong
// @version      1.3.1
// @description  BilibiliAPI，PC端抓包研究所得
// @author       SeaLoong
// @require      http://code.jquery.com/jquery-3.3.1.min.js
// @grant        none
// @license      MIT License
// ==/UserScript==

var BilibiliAPI = {
    // 整合常用API
    TreasureBox: {
        getAward: (time_start, end_time, captcha) => BilibiliAPI.lottery.SilverBox.getAward(time_start, end_time, captcha),
        getCaptcha: (ts) => BilibiliAPI.lottery.SilverBox.getCaptcha(ts),
        getCurrentTask: () => BilibiliAPI.lottery.SilverBox.getCurrentTask()
    },
    Exchange: {
        coin2silver: (num, csrf_token, platform) => BilibiliAPI.pay.coin2silver(num, csrf_token, platform),
        silver2coin: (csrf_token, platform) => BilibiliAPI.pay.silver2coin(csrf_token, platform),
        old: {
            coin2silver: (coin) => BilibiliAPI.exchange.coin2silver(coin),
            silver2coin: () => BilibiliAPI.exchange.silver2coin()
        }
    },
    Lottery: {
        Gift: {
            check: (roomid) => BilibiliAPI.gift.smalltv.check(roomid),
            join: (roomid, raffleId, csrf_token, visit_id, type) => BilibiliAPI.gift.smalltv.join(roomid, raffleId, csrf_token, visit_id, type),
            notice: (raffleId, type) => BilibiliAPI.gift.smalltv.notice(raffleId, type)
        },
        Raffle: {
            check: (roomid) => BilibiliAPI.activity.check(roomid),
            join: (roomid, raffleId) => BilibiliAPI.activity.join(roomid, raffleId),
            notice: (roomid, raffleId) => BilibiliAPI.activity.notice(roomid, raffleId)
        },
        MaterialObject: {
            getRoomActivityByRoomid: (roomid) => BilibiliAPI.lottery.box.getRoomActivityByRoomid(roomid),
            getStatus: (aid, times) => BilibiliAPI.lottery.box.getStatus(aid, times),
            draw: (aid, number) => BilibiliAPI.lottery.box.draw(aid, number),
            getWinnerGroupInfo: (aid, number) => BilibiliAPI.lottery.box.getWinnerGroupInfo(aid, number)
        },
        Guard: {
            check: (roomid) => BilibiliAPI.lottery.lottery.check(roomid),
            join: (roomid, id, csrf_token) => BilibiliAPI.lottery.lottery.join(roomid, id, csrf_token)
        }
    },
    Group: {
        my_groups: () => BilibiliAPI.link_group.my_groups(),
        sign_in: (group_id, owner_id) => BilibiliAPI.link_group.sign_in(group_id, owner_id)
    },
    Storm: {
        check: (roomid) => BilibiliAPI.lottery.Storm.check(roomid),
        join: (id, captcha_token, captcha_phrase, csrf_token, visit_id, color) => BilibiliAPI.lottery.Storm.join(id, captcha_token, captcha_phrase, csrf_token, visit_id, color)
    },
    HeartBeat: {
        web: () => BilibiliAPI.user.userOnlineHeart(),
        mobile: () => BilibiliAPI.mobile.userOnlineHeart()
    },
    DailyReward: {
        task: () => BilibiliAPI.home.reward(),
        login: () => BilibiliAPI.home.home(),
        watch: (aid, cid, mid, csrf, start_ts, played_time, realtime, type, play_type, dt) => BilibiliAPI.x.heartbeat(aid, cid, mid, csrf, start_ts, played_time, realtime, type, play_type, dt),
        coin: (aid, csrf, multiply) => BilibiliAPI.x.add(aid, csrf, multiply),
        share: () => {}
    },
    // ajax调用B站API
    last_ajax: 0,
    cnt_frequently_ajax: 0,
    ajax: (settings) => {
        if (Date.now() - BilibiliAPI.last_ajax < 10) {
            BilibiliAPI.cnt_frequently_ajax++;
        } else {
            BilibiliAPI.cnt_frequently_ajax = 0;
        }
        BilibiliAPI.last_ajax = Date.now();
        if (BilibiliAPI.cnt_frequently_ajax > 20) throw new Error('调用BilibiliAPI太快，可能出现了bug');
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
            method: settings.method || 'GET',
            crossDomain: true,
            dataType: settings.dataType || 'json'
        });
        return jQuery.ajax(settings);
    },
    // 以下按照URL分类
    ajaxGetCaptchaKey: () => {
        return BilibiliAPI.ajax({
            url: '//www.bilibili.com/plus/widget/ajaxGetCaptchaKey.php?js'
        });
    },
    msg: (roomid, csrf_token, visit_id) => {
        return BilibiliAPI.ajax({
            method: 'POST',
            url: 'ajax/msg',
            data: {
                roomid: roomid,
                csrf_token: csrf_token,
                visit_id: visit_id
            }
        });
    },
    ajaxCapsule: () => {
        return BilibiliAPI.ajax({
            url: 'api/ajaxCapsule'
        });
    },
    player: (id, ts, platform = 'pc', player_type = 'web') => {
        return BilibiliAPI.ajax({
            url: 'api/player',
            data: {
                id: typeof id === 'string' && id.substr(0, 4) === 'cid:' ? id : 'cid:' + id, // cid:{room_id}
                ts: typeof ts === 'string' ? ts : ts.toString(16), // HEX
                platform: platform,
                player_type: player_type
            },
            dataType: 'text'
        });
    },
    create: (width, height) => {
        // 生成一个验证码(用于节奏风暴)
        return BilibiliAPI.ajax({
            url: 'captcha/v1/Captcha/create',
            data: {
                width: width || '112',
                height: height || '32'
            },
            cache: false
        });
    },
    topList: (roomid, page, ruid) => {
        return BilibiliAPI.ajax({
            url: 'guard/topList',
            data: {
                roomid: roomid,
                page: page,
                ruid: ruid
            }
        });
    },
    getSuser: () => {
        return BilibiliAPI.ajax({
            url: 'msg/getSuser'
        });
    },
    refresh: (area = 'all') => {
        return BilibiliAPI.ajax({
            url: 'index/refresh?area=' + area
        });
    },
    get_ip_addr: () => {
        return BilibiliAPI.ajax({
            url: 'ip_service/v1/ip_service/get_ip_addr'
        });
    },
    getuserinfo: () => {
        return BilibiliAPI.ajax({
            url: 'user/getuserinfo'
        });
    },
    activity: {
        mobileActivity: () => {
            return BilibiliAPI.ajax({
                url: 'activity/v1/Common/mobileActivity'
            });
        },
        mobileRoomInfo: (roomid) => {
            return BilibiliAPI.ajax({
                url: 'activity/v1/Common/mobileRoomInfo',
                data: {
                    roomid: roomid
                }
            });
        },
        roomInfo: (roomid, ruid, area_v2_id, area_v2_parent_id) => {
            return BilibiliAPI.ajax({
                url: 'activity/v1/Common/roomInfo',
                data: {
                    roomid: roomid,
                    ruid: ruid,
                    area_v2_id: area_v2_id,
                    area_v2_parent_id: area_v2_parent_id
                }
            });
        },
        welcomeInfo: (roomid, ruid) => {
            return BilibiliAPI.ajax({
                url: 'activity/v1/Common/welcomeInfo',
                data: {
                    roomid: roomid,
                    ruid: ruid
                }
            });
        },
        check: (roomid) => {
            // 检查是否有活动抽奖
            return BilibiliAPI.ajax({
                url: 'activity/v1/Raffle/check?roomid=' + roomid
            });
        },
        join: (roomid, raffleId) => {
            // 参加活动抽奖
            return BilibiliAPI.ajax({
                url: 'activity/v1/Raffle/join',
                data: {
                    roomid: roomid,
                    raffleId: raffleId
                }
            });
        },
        notice: (roomid, raffleId) => {
            // 领取活动抽奖奖励
            return BilibiliAPI.ajax({
                url: 'activity/v1/Raffle/notice',
                data: {
                    roomid: roomid,
                    raffleId: raffleId
                }
            });
        },
        receive_award: (task_id, csrf_token) => {
            // 领取任务奖励
            return BilibiliAPI.ajax({
                method: 'POST',
                url: 'activity/v1/task/receive_award',
                data: {
                    task_id: task_id,
                    csrf_token: csrf_token
                }
            });
        }
    },
    av: {
        getTimestamp: (csrf_token, visit_id, platform = 'pc') => {
            return BilibiliAPI.ajax({
                method: 'POST',
                url: 'av/v1/Time/getTimestamp',
                data: {
                    platform: platform,
                    csrf_token: csrf_token,
                    visit_id: visit_id
                }
            });
        }
    },
    dynamic_svr: {
        dynamic_new: (uid, type = 8) => {
            // 获取动态
            return BilibiliAPI.ajax({
                url: 'dynamic_svr/v1/dynamic_svr/dynamic_new',
                data: {
                    uid: uid,
                    type: type // 8: 投稿视频; 268435455: 全部
                }
            });
        }
    },
    exchange: {
        coin2silver: (coin) => {
            // 硬币兑换银瓜子(旧API)，1硬币=900银瓜子
            return BilibiliAPI.ajax({
                method: 'POST',
                url: 'exchange/coin2silver',
                data: {
                    coin: coin
                }
            });
        },
        silver2coin: () => {
            // 银瓜子兑换硬币(旧API)，1400银瓜子=1硬币
            return BilibiliAPI.ajax({
                type: 'GET',
                url: 'exchange/silver2coin'
            });
        }
    },
    fans_medal: {
        get_fans_medal_info: (uid, target_id, csrf_token, visit_id, source = 1) => {
            return BilibiliAPI.ajax({
                method: 'POST',
                url: 'fans_medal/v1/fans_medal/get_fans_medal_info',
                data: {
                    source: source,
                    uid: uid,
                    target_id: target_id,
                    csrf_token: csrf_token,
                    visit_id: visit_id
                }
            });
        }
    },
    feed_svr: {
        notice: (csrf_token) => {
            return BilibiliAPI.ajax({
                method: 'POST',
                url: 'feed_svr/v1/feed_svr/notice',
                data: {
                    csrf_token: csrf_token
                }
            });
        },
        my: (page_size, csrf_token, live_status = 0, type = 0, offset = 0) => {
            return BilibiliAPI.ajax({
                method: 'POST',
                url: 'feed_svr/v1/feed_svr/my',
                data: {
                    live_status: live_status,
                    type: type,
                    page_size: page_size,
                    offset: offset,
                    csrf_token: csrf_token
                }
            });
        }
    },
    gift: {
        bag_list: () => {
            // 获取包裹礼物列表
            return BilibiliAPI.ajax({
                url: 'gift/v2/gift/bag_list'
            });
        },
        send: (uid, gift_id, ruid, gift_num, biz_id, rnd, csrf_token, visit_id, coin_type = 'silver', platform = 'pc', biz_code = 'live', storm_beat_id = 0, price = 0) => {
            // 消耗瓜子送礼
            return BilibiliAPI.ajax({
                method: 'POST',
                url: 'gift/v2/gift/send',
                data: {
                    uid: uid,
                    gift_id: gift_id,
                    ruid: ruid,
                    gift_num: gift_num,
                    coin_type: coin_type,
                    bag_id: 0,
                    platform: platform,
                    biz_code: biz_code,
                    biz_id: biz_id, // roomid
                    rnd: rnd,
                    storm_beat_id: storm_beat_id,
                    metadata: '',
                    price: price,
                    csrf_token: csrf_token,
                    visit_id: visit_id
                }
            });
        },
        bag_send: (uid, gift_id, ruid, gift_num, bag_id, biz_id, rnd, csrf_token, visit_id, platform = 'pc', biz_code = 'live', storm_beat_id = 0, price = 0) => {
            // 送出包裹中的礼物
            return BilibiliAPI.ajax({
                method: 'POST',
                url: 'gift/v2/live/bag_send',
                data: {
                    uid: uid,
                    gift_id: gift_id,
                    ruid: ruid,
                    gift_num: gift_num,
                    bag_id: bag_id,
                    platform: platform,
                    biz_code: biz_code,
                    biz_id: biz_id, // roomid
                    rnd: rnd,
                    storm_beat_id: storm_beat_id,
                    metadata: '',
                    price: price,
                    csrf_token: csrf_token,
                    visit_id: visit_id
                }
            });
        },
        gift_config: () => {
            return BilibiliAPI.ajax({
                url: 'gift/v3/live/gift_config'
            });
        },
        heart_gift_receive: (roomid, area_v2_id) => {
            return BilibiliAPI.ajax({
                url: 'gift/v2/live/heart_gift_receive',
                data: {
                    roomid: roomid,
                    area_v2_id: area_v2_id
                }
            });
        },
        heart_gift_status: (roomid, area_v2_id) => {
            return BilibiliAPI.ajax({
                url: 'gift/v2/live/heart_gift_status',
                data: {
                    roomid: roomid,
                    area_v2_id: area_v2_id
                }
            });
        },
        receive_daily_bag: () => {
            // 领取每日礼物
            return BilibiliAPI.ajax({
                url: 'gift/v2/live/receive_daily_bag'
            });
        },
        room_gift_list: (roomid, area_v2_id) => {
            return BilibiliAPI.ajax({
                url: 'gift/v2/live/room_gift_list',
                data: {
                    roomid: roomid,
                    area_v2_id: area_v2_id
                }
            });
        },
        smalltv: {
            // 礼物抽奖
            check: (roomid) => {
                return BilibiliAPI.ajax({
                    url: 'gift/v3/smalltv/check',
                    data: {
                        roomid: roomid
                    }
                });
            },
            join: (roomid, raffleId, csrf_token, visit_id, type = 'Gift') => {
                return BilibiliAPI.ajax({
                    method: 'POST',
                    url: 'gift/v3/smalltv/join',
                    data: {
                        roomid: roomid,
                        raffleId: raffleId,
                        type: type,
                        csrf_token: csrf_token,
                        visit_id: visit_id
                    }
                });
            },
            notice: (raffleId, type = 'small_tv') => {
                return BilibiliAPI.ajax({
                    url: 'gift/v3/smalltv/notice',
                    data: {
                        type: type,
                        raffleId: raffleId
                    }
                });
            }
        }
    },
    giftBag: {
        getSendGift: () => {
            return BilibiliAPI.ajax({
                url: 'giftBag/getSendGift'
            });
        },
        sendDaily: () => {
            return BilibiliAPI.ajax({
                url: 'giftBag/sendDaily'
            });
        }
    },
    home: {
        reward: () => {
            // 获取每日奖励情况
            return BilibiliAPI.ajax({
                url: '//account.bilibili.com/home/reward'
            });
        },
        home: () => {
            // 每日登录
            return BilibiliAPI.ajax({
                url: '//account.bilibili.com/account/home',
                dataType: 'html'
            });
        }
    },
    i: {
        ajaxCancelWear: () => {
            // 取消佩戴勋章
            return BilibiliAPI.ajax({
                url: 'i/ajaxCancelWear'
            });
        },
        ajaxGetAchieve: (keywords, page, pageSize = 6, type = 'normal', status = 0, category = 'all') => {
            return BilibiliAPI.ajax({
                url: 'i/api/ajaxGetAchieve',
                data: {
                    type: type, // 'legend'
                    status: status,
                    category: category,
                    keywords: keywords,
                    page: page,
                    pageSize: pageSize
                }
            });
        },
        ajaxGetMyMedalList: () => {
            // 勋章列表
            return BilibiliAPI.ajax({
                url: 'i/ajaxGetMyMedalList'
            });
        },
        ajaxWearFansMedal: (medal_id) => {
            // 佩戴勋章/更换当前佩戴的勋章
            return BilibiliAPI.ajax({
                url: 'i/ajaxWearFansMedal?medal_id=' + medal_id
            });
        },
        following: (page = 1, pageSize = 9) => {
            return BilibiliAPI.ajax({
                url: 'i/api/following',
                data: {
                    page: page,
                    pageSize: pageSize
                }
            });
        },
        guard: (page, pageSize = 10) => {
            return BilibiliAPI.ajax({
                url: 'i/api/guard',
                data: {
                    page: page,
                    pageSize: pageSize
                }
            });
        },
        liveinfo: () => {
            return BilibiliAPI.ajax({
                url: 'i/api/liveinfo'
            });
        },
        medal: (page = 1, pageSize = 10) => {
            // 获取勋章列表信息
            return BilibiliAPI.ajax({
                url: 'i/api/medal',
                data: {
                    page: page,
                    pageSize: pageSize
                }
            });
        },
        operation: (page = 1) => {
            return BilibiliAPI.ajax({
                url: 'i/api/operation?page=' + page
            });
        },
        taskInfo: () => {
            return BilibiliAPI.ajax({
                url: 'i/api/taskInfo'
            });
        }
    },
    link_group: {
        my_groups: () => {
            // 应援团列表
            return BilibiliAPI.ajax({
                url: 'link_group/v1/member/my_groups'
            });
        },
        sign_in: (group_id, owner_id) => {
            // 应援团签到
            return BilibiliAPI.ajax({
                url: 'link_setting/v1/link_setting/sign_in',
                data: {
                    group_id: group_id,
                    owner_id: owner_id
                }
            });
        }
    },
    live: {
        getRoomKanBanModel: (roomid) => {
            return BilibiliAPI.ajax({
                url: 'live/getRoomKanBanModel?roomid' + roomid
            });
        },
        rankTab: (roomid) => {
            return BilibiliAPI.ajax({
                url: 'live/rankTab?roomid=' + roomid
            });
        },
        roomAdList: () => {
            return BilibiliAPI.ajax({
                url: 'live/roomAdList'
            });
        }
    },
    live_user: {
        get_anchor_in_room: (roomid) => {
            return BilibiliAPI.ajax({
                url: 'live_user/v1/UserInfo/get_anchor_in_room?roomid=' + roomid
            });
        },
        get_info_in_room: (roomid) => {
            return BilibiliAPI.ajax({
                url: 'live_user/v1/UserInfo/get_info_in_room?roomid=' + roomid
            });
        },
        get_weared_medal: (uid, target_id, visit_id, csrf_token, source = 1) => {
            return BilibiliAPI.ajax({
                method: 'POST',
                url: 'live_user/v1/UserInfo/get_weared_medal',
                data: {
                    source: source,
                    uid: uid,
                    target_id: target_id, // ruid
                    visit_id: visit_id,
                    csrf_token: csrf_token
                }
            });
        },
        governorShow: (target_id) => {
            return BilibiliAPI.ajax({
                url: 'live_user/v1/Master/governorShow?target_id=' + target_id
            });
        }
    },
    lottery: {
        box: {
            getRoomActivityByRoomid: (roomid) => {
                // 获取房间特有的活动 （实物抽奖）
                return BilibiliAPI.ajax({
                    url: 'lottery/v1/box/getRoomActivityByRoomid?roomid=' + roomid
                });
            },
            getStatus: (aid, times = '') => {
                // 获取活动信息/状态
                return BilibiliAPI.ajax({
                    url: 'lottery/v1/box/getStatus',
                    data: {
                        aid: aid,
                        times: times
                    }
                });
            },
            draw: (aid, number = 1) => {
                // 参加实物抽奖
                return BilibiliAPI.ajax({
                    url: 'lottery/v1/box/draw',
                    data: {
                        aid: aid,
                        number: number
                    }
                });
            },
            getWinnerGroupInfo: (aid, number = 1) => {
                // 获取中奖名单
                return BilibiliAPI.ajax({
                    url: 'lottery/v1/box/getWinnerGroupInfo',
                    data: {
                        aid: aid,
                        number: number
                    }
                });
            }
        },
        SilverBox: {
            getAward: (time_start, end_time, captcha) => {
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
            getCaptcha: (ts) => {
                // 获取银瓜子验证码图片
                return BilibiliAPI.ajax({
                    url: 'lottery/v1/SilverBox/getCaptcha?ts=' + ts
                });
            },
            getCurrentTask: () => {
                // 获取领取银瓜子的任务
                return BilibiliAPI.ajax({
                    url: 'lottery/v1/SilverBox/getCurrentTask'
                });
            }
        },
        Storm: {
            check: (roomid) => {
                // 检查是否有节奏风暴
                return BilibiliAPI.ajax({
                    url: 'lottery/v1/Storm/check?roomid=' + roomid
                });
            },
            join: (id, captcha_token, captcha_phrase, roomid, csrf_token, visit_id, color = 16777215) => {
                // 参加节奏风暴
                return BilibiliAPI.ajax({
                    method: 'POST',
                    url: 'lottery/v1/Storm/join',
                    data: {
                        id: id,
                        color: color,
                        captcha_token: captcha_token,
                        captcha_phrase: captcha_phrase,
                        roomid: roomid,
                        csrf_token: csrf_token,
                        visit_id: visit_id
                    }
                });
            }
        },
        lottery: {
            check: (roomid) => {
                // 检查是否有总督领奖(与节奏风暴?)
                return BilibiliAPI.ajax({
                    url: 'lottery/v1/lottery/check?roomid=' + roomid
                });
            },
            join: (roomid, id, csrf_token, visit_id, type = 'guard') => {
                // 参加总督领奖
                return BilibiliAPI.ajax({
                    method: 'POST',
                    url: 'lottery/v1/lottery/join',
                    data: {
                        roomid: roomid,
                        id: id,
                        type: type,
                        csrf_token: csrf_token,
                        visit_id: visit_id
                    }
                });
            }
        }
    },
    mobile: {
        userOnlineHeart: () => {
            return BilibiliAPI.ajax({
                method: 'POST',
                url: 'mobile/userOnlineHeart'
            });
        }
    },
    pay: {
        coin2silver: (num, csrf_token, platform = 'pc') => {
            // 硬币兑换银瓜子(新API)，1硬币=450银瓜子
            return BilibiliAPI.ajax({
                method: 'POST',
                url: 'pay/v1/Exchange/coin2silver',
                data: {
                    num: num,
                    platform: platform,
                    csrf_token: csrf_token
                }
            });
        },
        getRule: (platform = 'pc') => {
            return BilibiliAPI.ajax({
                url: 'pay/v1/Exchange/getRule?platform=' + platform
            });
        },
        getStatus: (platform = 'pc') => {
            return BilibiliAPI.ajax({
                url: 'pay/v1/Exchange/getStatus?platform=' + platform
            });
        },
        silver2coin: (csrf_token, platform = 'pc') => {
            // 银瓜子兑换硬币，700银瓜子=1硬币
            return BilibiliAPI.ajax({
                method: 'POST',
                url: 'pay/v1/Exchange/silver2coin',
                data: {
                    platform: platform,
                    csrf_token: csrf_token
                }
            });
        }
    },
    rankdb: {
        roomInfo: (ruid, roomid, areaId) => {
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
    relation: {
        getList: (page, page_size) => {
            return BilibiliAPI.ajax({
                url: 'relation/v1/feed/getList',
                data: {
                    page: page,
                    page_size: page_size
                },
                cache: false
            });
        },
        heartBeat: () => {
            return BilibiliAPI.ajax({
                url: 'relation/v1/feed/heartBeat',
                cache: false
            });
        },
        GetUserFc: (follow) => { // follow: 主播uid===ruid
            return BilibiliAPI.ajax({
                url: 'relation/v1/Feed/GetUserFc?follow=' + follow
            });
        },
        IsUserFollow: (follow) => { // follow: 主播uid===ruid
            return BilibiliAPI.ajax({
                url: 'relation/v1/Feed/IsUserFollow?follow=' + follow
            });
        }
    },
    room: {
        get_info: (room_id, from = 'room') => {
            return BilibiliAPI.ajax({
                url: 'room/v1/Room/get_info',
                data: {
                    room_id: room_id,
                    from: from
                }
            });
        },
        get_recommend_by_room: (room_id, count, rnd) => {
            return BilibiliAPI.ajax({
                url: 'room/v1/room/get_recommend_by_room',
                data: {
                    room_id: room_id,
                    count: count,
                    rnd: rnd || Math.floor(Date.now() / 1000)
                }
            });
        },
        playUrl: (cid, quality = '0', platform = 'web') => {
            return BilibiliAPI.ajax({
                url: 'room/v1/Room/playUrl',
                data: {
                    cid: cid, // roomid
                    quality: quality,
                    platform: platform
                }
            });
        },
        room_entry_action: (room_id, visit_id, csrf_token, platform = 'pc') => {
            return BilibiliAPI.ajax({
                method: 'POST',
                url: 'room/v1/Room/room_entry_action',
                data: {
                    room_id: room_id,
                    visit_id: visit_id,
                    platform: platform,
                    csrf_token: csrf_token
                }
            });
        },
        room_init: (id) => {
            return BilibiliAPI.ajax({
                url: 'room/v1/Room/room_init?id=' + id
            });
        }
    },
    sign: {
        doSign: () => {
            // 签到
            return BilibiliAPI.ajax({
                url: 'sign/doSign'
            });
        },
        GetSignInfo: () => {
            // 获取签到信息
            return BilibiliAPI.ajax({
                url: 'sign/GetSignInfo'
            });
        },
        getLastMonthSignDays: () => {
            return BilibiliAPI.ajax({
                url: 'sign/getLastMonthSignDays'
            });
        }
    },
    user: {
        getWear: (uid) => {
            return BilibiliAPI.ajax({
                url: 'user/v1/user_title/getWear?uid=' + uid
            });
        },
        isBiliVip: (uid) => {
            return BilibiliAPI.ajax({
                url: 'user/v1/user/isBiliVip?uid=' + uid
            });
        },
        userOnlineHeart: () => {
            return BilibiliAPI.ajax({
                method: 'POST',
                url: 'User/userOnlineHeart'
            });
        },
        getUserInfo: (ts) => { // ms
            return BilibiliAPI.ajax({
                url: 'User/getUserInfo?ts=' + ts
            });
        }
    },
    x: {
        add: (aid, csrf, multiply = 1) => {
            // 投币
            return BilibiliAPI.ajax({
                method: 'POST',
                url: '//api.bilibili.com/x/web-interface/coin/add',
                data: {
                    aid: aid,
                    multiply: multiply,
                    cross_domain: true,
                    csrf: csrf
                }
            });
        },
        heartbeat: (aid, cid, mid, csrf, start_ts, played_time = 0, realtime = 0, type = 3, play_type = 2, dt = 2) => {
            // B站视频心跳，观看视频任务判定
            return BilibiliAPI.ajax({
                method: 'POST',
                url: '//api.bilibili.com/x/report/web/heartbeat',
                data: {
                    aid: aid,
                    cid: cid,
                    mid: mid, // uid
                    csrf: csrf,
                    start_ts: start_ts || Date.now(),
                    played_time: played_time,
                    realtime: realtime,
                    type: type,
                    play_type: play_type,
                    dt: dt
                }
            });
        }
    },
    YearWelfare: {
        checkFirstCharge: () => {
            return BilibiliAPI.ajax({
                url: 'YearWelfare/checkFirstCharge'
            });
        },
        inviteUserList: () => {
            return BilibiliAPI.ajax({
                url: 'YearWelfare/inviteUserList/1'
            });
        }
    },
    DanmuWebSocket: class extends WebSocket {
        static stringToUint(string) {
            const str = unescape(encodeURIComponent(string));
            const charList = str.split('');
            const uintArray = [];
            for (var i = 0; i < charList.length; ++i) {
                uintArray.push(charList[i].charCodeAt(0));
            }
            return new Uint8Array(uintArray);
        }
        static uintToString(uintArray) {
            const encodedString = String.fromCharCode.apply(null, uintArray);
            const decodedString = decodeURIComponent(escape(encodedString));
            return decodedString;
        }
        constructor(uid, roomid, serveraddress = 'wss://broadcastlv.chat.bilibili.com/sub', protover = 1, platform = 'web', clientver = '1.4.6') {
            super(serveraddress);
            this.binaryType = 'arraybuffer';
            this.handlers = {
                reconnect: [],
                login: [],
                heartbeat: [],
                cmd: [],
                receive: []
            };
            this.addEventListener('open', () => {
                this.sendLoginPacket(uid, roomid, protover, platform, clientver).sendHeartBeatPacket();
                this.heartBeatHandler = setInterval(() => {
                    this.sendHeartBeatPacket();
                }, 30e3);
            });
            this.addEventListener('close', (event) => {
                if (this.heartBeatHandler) clearInterval(this.heartBeatHandler);
                if (event.code === 1000) return;
                // 自动重连
                setTimeout(() => {
                    const ws = new BilibiliAPI.DanmuWebSocket(uid, roomid, serveraddress, protover, platform, clientver);
                    ws.handlers = this.handlers;
                    for (const key in this.handlers) {
                        if (this.handlers.hasOwnProperty(key)) {
                            this.handlers[key].forEach(handler => {
                                switch (key) {
                                    case 'reconnect':
                                        ws.addEventListener('reconnect', (event) => {
                                            handler.call(ws, event.detail.ws);
                                        });
                                        break;
                                    case 'login':
                                        ws.addEventListener('login', () => {
                                            handler.call(ws);
                                        });
                                        break;
                                    case 'heartbeat':
                                        ws.addEventListener('heartbeat', (event) => {
                                            handler.call(ws, event.detail.num);
                                        });
                                        break;
                                    case 'cmd':
                                        ws.addEventListener('cmd', (event) => {
                                            handler.call(ws, event.detail.obj, event.detail.str);
                                        });
                                        break;
                                    case 'receive':
                                        ws.addEventListener('receive', (event) => {
                                            handler.call(ws, event.detail.len, event.detail.headerLen, event.detail.protover, event.detail.operation, event.detail.sequence, event.detail.data);
                                        });
                                        break;
                                }
                            });
                        }
                    }
                    this.dispatchEvent(new CustomEvent('reconnect', {
                        detail: {
                            ws: ws
                        }
                    }));
                }, 5e3);
            });
            this.addEventListener('message', (event) => {
                let dv = new DataView(event.data);
                let position = 0;
                while (position < event.data.byteLength) {
                    /*
                    登录 Uint(4byte) + 00 10 + 00 01 + 00 00 00 08 + 00 00 00 01
                    心跳 Uint(4byte) + 00 10 + 00 01 + 00 00 00 03 + 00 00 00 01 + Uint(4byte)
                    弹幕消息/系统消息/送礼 Uint(4byte) + 00 10 + 00 00 + 00 00 00 05 + 00 00 00 00 + Data
                    */
                    let len = dv.getUint32(position);
                    let headerLen = dv.getUint16(position + 4);
                    let protover = dv.getUint16(position + 6);
                    let operation = dv.getUint32(position + 8);
                    let sequence = dv.getUint32(position + 12);
                    switch (operation) {
                        case 3:
                            const num = dv.getUint32(headerLen); // 在线人数
                            this.dispatchEvent(new CustomEvent('heartbeat', {
                                detail: {
                                    num: num
                                }
                            }));
                            break;
                        case 5:
                            const str = BilibiliAPI.DanmuWebSocket.uintToString(new Uint8Array(event.data, position + headerLen, len - headerLen));
                            const obj = JSON.parse(str);
                            this.dispatchEvent(new CustomEvent('cmd', {
                                detail: {
                                    obj: obj,
                                    str: str
                                }
                            }));
                            break;
                        case 8:
                            this.dispatchEvent(new CustomEvent('login'));
                            break;
                    }
                    this.dispatchEvent(new CustomEvent('receive', {
                        detail: {
                            len: len,
                            headerLen: headerLen,
                            protover: protover,
                            operation: operation,
                            sequence: sequence,
                            data: event.data.slice(position + headerLen, position + len)
                        }
                    }));
                    position += len;
                }
            });
        }
        bind(onreconnect = undefined, onlogin = undefined, onheartbeat = undefined, oncmd = undefined, onreceive = undefined) {
            /*
            参数说明
            onreconnect(DanmuWebSocket) // 必要，DanmuWebSocket为新的
            onlogin()
            onheartbeat(number)
            oncmd(object, string)
            onreceive(number, number, number, number, number, arraybuffer)
            */
            if (typeof onreconnect === 'function') {
                this.addEventListener('reconnect', (event) => {
                    onreconnect.call(this, event.detail.ws);
                });
                this.handlers.reconnect.push(onreconnect);
            }
            if (typeof onlogin === 'function') {
                this.addEventListener('login', () => {
                    onlogin.call(this);
                });
                this.handlers.login.push(onlogin);
            }
            if (typeof onheartbeat === 'function') {
                this.addEventListener('heartbeat', (event) => {
                    onheartbeat.call(this, event.detail.num);
                });
                this.handlers.heartbeat.push(onheartbeat);
            }
            if (typeof oncmd === 'function') {
                this.addEventListener('cmd', (event) => {
                    oncmd.call(this, event.detail.obj, event.detail.str);
                });
                this.handlers.cmd.push(oncmd);
            }
            if (typeof onreceive === 'function') {
                this.addEventListener('receive', (event) => {
                    onreceive.call(this, event.detail.len, event.detail.headerLen, event.detail.protover, event.detail.operation, event.detail.sequence, event.detail.data);
                });
                this.handlers.receive.push(onreceive);
            }
        }
        sendData(data, protover = 1, operation = 2, sequence = 1) {
            if (this.readyState !== WebSocket.OPEN) throw new Error('DanmuWebSocket未连接');
            switch (Object.prototype.toString.call(data)) {
                case '[object Object]':
                    return this.sendData(JSON.stringify(data), protover, operation, sequence);
                case '[object String]':
                    {
                        let dataUint8Array = BilibiliAPI.DanmuWebSocket.stringToUint(data);
                        let buffer = new ArrayBuffer(BilibiliAPI.DanmuWebSocket.headerLength + dataUint8Array.byteLength);
                        let dv = new DataView(buffer);
                        dv.setUint32(0, BilibiliAPI.DanmuWebSocket.headerLength + dataUint8Array.byteLength);
                        dv.setUint16(4, BilibiliAPI.DanmuWebSocket.headerLength);
                        dv.setUint16(6, parseInt(protover, 10));
                        dv.setUint32(8, parseInt(operation, 10));
                        dv.setUint32(12, parseInt(sequence, 10));
                        for (let i = 0; i < dataUint8Array.byteLength; ++i) {
                            dv.setUint8(BilibiliAPI.DanmuWebSocket.headerLength + i, dataUint8Array[i]);
                        }
                        this.send(buffer);
                    }
                    return this;
                default:
                    this.send(data);
            }
            return this;
        }
        sendLoginPacket(uid, roomid, protover = 1, platform = 'web', clientver = '1.4.6') {
            // Uint(4byte) + 00 10 + 00 01 + 00 00 00 07 + 00 00 00 01 + Data 登录数据包
            const data = {
                'uid': parseInt(uid, 10),
                'roomid': parseInt(roomid, 10),
                'protover': protover,
                'platform': platform,
                'clientver': clientver
            };
            return this.sendData(data, 1, 7, 1);
        }
        sendHeartBeatPacket() {
            // Uint(4byte) + 00 10 + 00 01 + 00 00 00 02 + 00 00 00 01 + Data 心跳数据包
            return this.sendData('[object Object]', 1, 2, 1);
        }
    }
};

BilibiliAPI.DanmuWebSocket.headerLength = 16;