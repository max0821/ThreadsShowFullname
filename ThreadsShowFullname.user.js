// ==UserScript==
// @name         Threads Show FullName
// @namespace    http://tampermonkey.net/
// @version      20240306
// @description  Show Threads FullName
// @author       Max0821
// @match        https://www.threads.net/
// @require      http://code.jquery.com/jquery-1.12.4.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=threads.net
// @grant        GM_xmlhttpRequest
// ==/UserScript==
/*
If Not Work Install This
https://greasyfork.org/en/scripts/433051-trusted-types-helper/code
*/
var graphql_args = false;
var fullname_list = {};
(function() {
    'use strict';
    hook_xhr();
})();

function set_fullname(){
    //console.log('set_fullname');
    $('a[href^="/@"]').not('[tm]').each(function(){

        if($(this).parent().find('svg[aria-label="關閉"]').length > 0){
            $(this).attr('tm','pass');
            return;
        }

        $(this).attr('tm','check');

        let m_id = $(this).attr('href').match(/\/@([0-9a-z-_\.]+)$/);

        if(m_id)
        {
            let obj = $(this).find('span');
            $(this).attr('tm','ok');
            get_fullname(m_id[1],obj);
        }
    });
    setTimeout(set_fullname,3000);
}

function get_fullname(id,obj){
    let post_data = graphql_args;
    if(fullname_list[id])
    {
        obj.html(fullname_list[id]+' <span style="opacity:0.5">('+id+')</span>');
        console.log('set fullname cache',id,fullname_list[id]);
        return;
    }
    post_data.fb_api_caller_class = 'RelayModern';
    post_data.fb_api_req_friendly_name = 'BarcelonaUsernameHoverCardImplQuery';
    post_data.doc_id = 7836827812997169;
    post_data.variables = '{"username":"'+id+'","__relay_internal__pv__BarcelonaShouldShowFediverseM075Featuresrelayprovider":false}';
    post_data.server_timestamps = true;
    post_data.fb_dtsg = decodeURIComponent(post_data.fb_dtsg);
    post_data.__s = decodeURIComponent(post_data.__s);
    post_data.dpr = parseInt(post_data.dpr);
    post_data.__hs = decodeURIComponent(post_data.__hs);
    post_data.__a = parseInt(post_data.__a);
    post_data.__comet_req = parseInt(post_data.__comet_req);
    post_data.__jssesw = parseInt(post_data.__jssesw);
    post_data.__rev = parseInt(post_data.__rev);
    post_data.__spin_r = parseInt(post_data.__spin_r);
    post_data.__spin_t = parseInt(post_data.__spin_t);
    post_data.__user = parseInt(post_data.__user);

    ajax('/api/graphql?1',post_data,function(data){
        if(data.data.xdt_user_by_username.full_name)
        {
            fullname_list[id] = data.data.xdt_user_by_username.full_name;
            obj.html(fullname_list[id]+' <span style="opacity:0.5">('+id+')</span>');
            console.log('set fullname',id,data.data.xdt_user_by_username.full_name);
        }
    });
}

function ajax(url,post,callback)
{
    var ajax_method = 'GET';
    if(post)
    {
        ajax_method = 'POST';
        //console.log('GM_ajax post:',post);
        var post_data = '';
        $.each(post,function(k,v){
            post_data += k+'='+v+'&';
        });
    }

    GM_xmlhttpRequest({
        method: ajax_method,
        url:url,
        data:post_data,
        headers: {'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},
        responseType :"json",
        onerror : function () {
            console.log('Network Load  Error');
            return;
        },
        onload: function(res) {
            //console.log('response=',JSON.stringify(res.response));
            //console.log(res);
            /*
            if(res.response.status == "error"){
                var err = {};
                err.status = 'error';
                err.msg    = res.response.msg;
                if(res.response.href) err.href= res.response.href;
                callback(err);
                return;
            }
            */

            if(callback)
            {
                callback(res.response);
                return;
            }
            return res.response;
        }
    });
}

function hook_xhr()
{
    var origOpen   = XMLHttpRequest.prototype.open;
    var origSend   = XMLHttpRequest.prototype.send;
    var origHeader = XMLHttpRequest.headers;

    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        let obj = this;
        this._url = url;
        origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(data){
        if(/graphql/.test(this._url))
        {

            if(!graphql_args)
            {
                let q = arguments[0].split('&');
                let q2 = {};
                for(let i=0;i<q.length;i++)
                {
                    let tmp = q[i].split('=');
                    q2[tmp[0]] = tmp[1];
                }
                graphql_args = q2;
                set_fullname();
            }
        }
        return origSend.apply(this, arguments);
    };
}
