// ==UserScript==
// @name         PoE All Ears Wiki Tracker
// @namespace    https://github.com/halfacandan/PoEUserScripts
// @version      1.2
// @description  Track which objectives for the "All Ears" achievement have been completed on the PoE Wiki
// @author       halfacandan
// @match        https://pathofexile.gamepedia.com/All_Ears*
// @match        https://pathofexile.fandom.com/wiki/All_Ears*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @grant        GM.setValue
// @grant        GM.getValue
// ==/UserScript==

(async () => {
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

        let completedAchievementCount = completedAchievements.filter(onlyUnique).length;
        let achievementCount = achievementIds.filter(onlyUnique).length;

        $("#achievementCounter p:eq(0)").text(`${completedAchievementCount} of ${achievementCount} (${Math.round(completedAchievementCount/achievementCount*100)}%)`);
    }

    async function switchColourBlindMode(colourBlindModeEnabled){

        if(colourBlindModeEnabled){
            $(".colourBlindModeOff").addClass("colourBlindMode").removeClass("colourBlindModeOff");
        } else {
            $(".colourBlindMode").addClass("colourBlindModeOff").removeClass("colourBlindMode");
        }

         await GM.setValue('colourBlindMode', colourBlindModeEnabled);
    }

    function removeArrayValue(array,value){

        var index = array.indexOf(value);
        if (index > -1) {
            array.splice(index, 1);
            return true;
        }
        return false;
    }

    async function getAchievements(){

        var achievementsString = await GM.getValue('poe_achievements', "");
        if(achievementsString.indexOf(",") > 0){
            return achievementsString.split(",");
        } else {
            return achievementsString == "" ? [] : [achievements.filter(onlyUnique)];
        }
    }

    async function setAchievements(completedAchievements){

        await GM.setValue('poe_achievements', completedAchievements.filter(onlyUnique).join(","));
    }

  	var colourBlindMode = await GM.getValue('colourBlindMode', true);
    let completedAchievements = await getAchievements();
    var achievements = $("table.wikitable:not(table.responsive-table) tr:not(:nth-child(1)) td:nth-child(1)");
    var achievementIds = [];

    // Filter out rowspan issues
    achievements = achievements.filter(function() {
        return $(this).text() * 1 > 0;
    });

    var achievementDetail = $("table.wikitable tr:not(:nth-child(1))");

    $(document).ready(function(){
        $(`<style type='text/css'>
              .achievementId{ cursor:pointer; color:red; }
              .completed{ color:green !important; font-weight:bold; }
              .completed.colourBlindMode:before{ content: '✅'; }
              .brokenOrder:after{ content: '*'; }
              .doNot:after{ content: '▶'; }
              .brokenOrder.doNot:after{ content: '*▶'; }
              #achievementCounter{ position:fixed; left:0; top:0; height:150px; width:180px; padding:10px; background-color:#fff; z-index:9999; text-align: center; }
              .guideInfo{ font-size: 80%; text-aligh: left;}
              #colourBlindModeLabel{ font-size: 70%; }
          </style>`).appendTo("head");

        $(`<div id="achievementCounter"><p></p><p class="guideInfo">Tasks marked with * occur out of sequence</p><p class="guideInfo">Tasks marked with ▶ can only be completed at certain points</p><input id="colourBlindMode" type="checkbox"${(colourBlindMode ? " checked" : "")}/><label id="colourBlindModeLabel" for="colourBlindMode">Enable Colour Blind Mode</label></div>`).appendTo("body");

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
            $(this).addClass("colourBlindMode" + (colourBlindMode ? "" : "Off"));
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

        $(document).on("click","table.wikitable tr td.achievementId", async function(){
            if($(this).hasClass("completed")){
                $(this).removeClass("completed");
                await updateAchievementCount("remove",$(this).attr("data-num"));
            } else {
                $(this).addClass("completed");
                await updateAchievementCount("add",$(this).attr("data-num"));
            }
        });

        $("#colourBlindMode,#colourBlindModeLabel").click(async function(){

            await switchColourBlindMode($("#colourBlindMode").is(":checked"));
        });
    });
})();