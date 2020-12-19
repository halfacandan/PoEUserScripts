// ==UserScript==
// @name         PoE All Ears Wiki Tracker
// @namespace    https://github.com/halfacandan/PoEUserScripts
// @version      1.0
// @description  Track which objectives for the "All Ears" achievement have been completed on the PoE Wiki
// @author       halfacandan
// @match        https://pathofexile.gamepedia.com/All_Ears*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';
    function updateAchievementCount(action,id){
        if(action == "add"){
            completedAchievements.push(id);
        } else {
            removeArrayValue(completedAchievements,id);
        }
        redrawAchievementCount();
        setAchievements(completedAchievements);
    }

    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    function redrawAchievementCount(){
        console.log(completedAchievements.sort((a, b) => a*1 - b*1));
        console.log(achievementIds.sort((a, b) => a - b));
        let completedAchievementCount = completedAchievements.filter(onlyUnique).length;
        let achievementCount = achievementIds.filter(onlyUnique).length;
        console.log(achievementCount);
        $("#achievementCounter p:eq(0)").text(`${completedAchievementCount} of ${achievementCount} (${Math.round(completedAchievementCount/achievementCount*100)}%)`);
    }

    function removeArrayValue(array,value){
        var index = array.indexOf(value);
        if (index > -1) {
            array.splice(index, 1);
            return true;
        }
        return false;
    }

    function getAchievements(){
        var achievementsString = GM_getValue('poe_achievements', "");
        if(achievementsString.indexOf(",") > 0){
            return achievementsString.split(",");
        } else {
            return achievementsString == "" ? [] : [achievements.filter(onlyUnique)];
        }
    }
    function setAchievements(completedAchievements){
        GM_setValue('poe_achievements', completedAchievements.filter(onlyUnique).join(","));
    }

    let completedAchievements = getAchievements();
    var achievements = $("table.wikitable:not(table.responsive-table) tr:not(:nth-child(1)) td:nth-child(1)");
    var achievementIds = [];
    // Filter out rowspan issues
    achievements = achievements.filter(function() {
        return $(this).text() * 1 > 0;
    });

    var achievementDetail = $("table.wikitable tr:not(:nth-child(1))");

    $(document).ready(function(){
        $("<style type='text/css'>.achievementId{cursor:pointer; color:red;} .completed{ color:green !important; font-weight:bold;} .brokenOrder:after{ content: '*';} .doNot:after{ content: '▼';} .brokenOrder.doNot:after{ content: '*▼';}#achievementCounter{ position:fixed;left:0;top:0;height:120px;width:160px;padding:10px;background-color:#fff;z-index:9999;text-align: center;} .guideInfo{ font-size: 80%; text-aligh: left;}</style>").appendTo("head");

        $('<div id="achievementCounter"><p></p><p class="guideInfo">Tasks marked with * occur out of sequence</p><p class="guideInfo">Tasks marked with ▼ can only be completed at certain points</p></div>').appendTo("body");

        // Find the "DO NOT" tasks
        var achievementDoNot = [];
        var rows;
        for(var i = 0; i< achievementDetail.length; i++){
            var rowDetail = $(achievementDetail[i]);
            var isDoNot = rowDetail.find("td:last").text().match(/\b[A-Z][A-Z]+\b/g) != null;
            var isTaskRow = !isNaN(rowDetail.find("td:first").text() * 1);
            if(isTaskRow){
                if(rowDetail.find("td:last").attr("rowspan") == null){
                    rows = rowDetail.find("td:nth-child(2)").attr("rowspan") * 1;
                    if(isNaN(rows)) {
                        rows = 1;
                    }
                } else {
                    rows = rowDetail.find("td:last").attr("rowspan") * 1;
                }

                for(var j=0; j < rows; j++){
                    var isNextRowTaskRow = !isNaN($(achievementDetail[i+1]).find("td:first").text() * 1);
                    if(j > 0 && rows > 1 && !isNextRowTaskRow) {
                        i++;
                    } else {
                        achievementDoNot.push(isDoNot);
                        if(rows > 1 && j > 0) {
                            i++;
                        }
                    }
                }
            }
        }

        // Mark achievements
        var prevAchievementId = 0;
        var prevAchievement;
        achievements.each(function(index){
            var id = $(this).text() * 1;
            if(achievementIds.indexOf(id) < 0) { achievementIds.push(id); }

            $(this).attr("data-num",id).addClass("achievementId");
            if(achievementDoNot[index]){
                $(this).addClass("doNot");
            }
            if(id > prevAchievementId + 1){
                prevAchievement.addClass("brokenOrder");
                $(this).addClass("brokenOrder");
            }
            prevAchievementId = id;
            prevAchievement = $(this);
        });

        redrawAchievementCount();

        var completedAchievementDOM = achievements.filter(function() {
            return completedAchievements.indexOf($(this).attr("data-num")) >= 0;
        });
        completedAchievementDOM.addClass("completed");

        $(document).on("click","table.wikitable tr td.achievementId",function(){
            if($(this).hasClass("completed")){
                $(this).removeClass("completed");
                updateAchievementCount("remove",$(this).attr("data-num"));
            } else {
                $(this).addClass("completed");
                updateAchievementCount("add",$(this).attr("data-num"));
            }
        });
    });
})();