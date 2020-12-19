// ==UserScript==
// @name         PoE No Stone Unturned Wiki Tracker
// @namespace    https://github.com/halfacandan/PoEUserScripts
// @version      1.0
// @description  Track which objectives for the "No Stone Unturned" achievement have been completed on the PoE Wiki
// @author       halfacandan
// @match        https://pathofexile.gamepedia.com/No_Stone_Unturned*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';
    function updateLoreCount(action,id){
        if(action == "add"){
            completedLores.push(id);
        } else {
            removeArrayValue(completedLores,id);
        }
        redrawLoreCount();
        setLores(completedLores);
    }
    function redrawLoreCount(){
        $("#loreCounter p:eq(0)").text(`${completedLores.length} of ${lores.length} (${Math.round(completedLores.length/lores.length*100)}%)`);
    }

    function removeArrayValue(array,value){
        var index = array.indexOf(value);
        if (index > -1) {
            array.splice(index, 1);
            return true;
        }
        return false;
    }

    function getLores(){
        var loresString = GM_getValue('poe_lores', "");
        if(loresString.indexOf(",") > 0){
            return loresString.split(",");
        } else {
            return loresString == "" ? [] : [loresString];
        }
    }
    function setLores(completedLores){
        GM_setValue('poe_lores', completedLores.join(","));
    }

    let completedLores = getLores();
    var lores = $("table.wikitable:not(table.wikitable:eq(0),table.responsive-table) tbody tr td:nth-child(1)");

    $(document).ready(function(){

        $("<style type='text/css'>.loreId{cursor:pointer; color:red;} .completed{ color:green !important; font-weight:bold;} #loreCounter{ position:fixed;left:0;top:0;height:40px;width:160px;padding:10px;background-color:#fff;z-index:9999;text-align: center;} </style>").appendTo("head");

        $('<div id="loreCounter"><p></p></div>').appendTo("body");
        redrawLoreCount();

        lores.each(function(){
            var id = $(this).text();
            $(this).attr("data-num",id).addClass("loreId");
        });

        var completedLoreDOM = lores.filter(function() {
            return completedLores.indexOf($(this).attr("data-num")) >= 0;
        });
        completedLoreDOM.addClass("completed");

        $(document).on("click","table.wikitable tr td.loreId",function(){
            if($(this).hasClass("completed")){
                $(this).removeClass("completed");
                updateLoreCount("remove",$(this).attr("data-num"));
            } else {
                $(this).addClass("completed");
                updateLoreCount("add",$(this).attr("data-num"));
            }
        });
    });
})();