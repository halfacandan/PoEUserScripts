// ==UserScript==
// @name         PoE No Stone Unturned Wiki Tracker
// @namespace    https://github.com/halfacandan/PoEUserScripts
// @version      1.3
// @description  Track which objectives for the "No Stone Unturned" achievement have been completed on the PoE Wiki
// @author       halfacandan
// @match        https://pathofexile.gamepedia.com/No_Stone_Unturned*
// @match        https://pathofexile.fandom.com/wiki/No_Stone_Unturned*
// @match        https://www.poewiki.net/wiki/No_Stone_Unturned*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js
// @require      https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js
// @grant        GM.setValue
// @grant        GM.getValue
// ==/UserScript==

(async () => {
    'use strict';

    async function updateLoreCount(action,id){

        switch(action) {
          case "add":
            completedLores.push(id);
            break;
          case "reset":
            // Reset the tracking array
            completedLores = [];
            // Remove the green ticks
            $(".loreId.completed").removeClass("completed");
            break;
          default:
            // "remove"
            removeArrayValue(completedLores,id);
        }

      	redrawLoreCount();

        await setLores(completedLores);
    }

    function redrawLoreCount(){

      	let completedLoresLength = (typeof completedLores.length === "undefined" ? 0 : completedLores.length);

        $("#loreCounter p:eq(0)").text(`${completedLoresLength} of ${lores.length} (${Math.round(completedLoresLength/lores.length*100)}%)`);
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

    async function getLores(){

        var loresString = await GM.getValue('poe_lores', "");

      	if(loresString.indexOf(",") > 0){
            return loresString.split(",");
        } else {
            return loresString == "" ? [] : [loresString];
        }
    }

    async function setLores(completedLores){

        await GM.setValue('poe_lores', completedLores.join(","));
    }

		var colourBlindMode = await GM.getValue('colourBlindMode', true);
    var completedLores = await getLores();
    var lores = $("table.wikitable:not(table.wikitable:eq(0),table.responsive-table) tbody tr td:nth-child(1)");

  	var jQueryUiStylesheetUri = "https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css";

    $(document).ready(function(){

        $(`<style type='text/css'>
            .loreId{cursor:pointer; color:red; }
            .completed{ color:green !important; font-weight:bold;}
            .completed.colourBlindMode:before{ content: '✅'; }
            #loreCounter{ position:fixed; left:66px; top:0; height:120px; width:190px; padding:10px; background-color:#fff; z-index:9999; text-align: center; }
            #colourBlindModeLabel{ font-size: 70%; }
            #resetButton { font-size: 70%; margin-top: 13px; }
        </style>`).appendTo("head");

      	$(`<link rel="stylesheet" href="${jQueryUiStylesheetUri}">`).appendTo("head");

        $(`<div id="loreCounter">
                <p></p>
                <input id="colourBlindMode" type="checkbox"${(colourBlindMode ? " checked" : "")}/><label id="colourBlindModeLabel" for="colourBlindMode">Enable Colour Blind Mode</label>
                <button id="resetButton" class="ui-button ui-widget ui-corner-all" title="Reset your progress">
                    <span class="ui-icon ui-icon ui-icon-alert"></span>
                    Reset Your Progress
                </button>
            </div>`).appendTo("body");

        redrawLoreCount();

        lores.each(function(){
            var id = $(this).text();
            $(this).attr("data-num",id).addClass("loreId");
            $(this).addClass("colourBlindMode" + (colourBlindMode ? "" : "Off"));
        });

        var completedLoreDOM = lores.filter(function() {
            return completedLores.indexOf($(this).attr("data-num")) >= 0;
        });
        completedLoreDOM.addClass("completed");

				$(document).on("click","table.wikitable tr td.loreId",async function (){
            if($(this).hasClass("completed")){
                $(this).removeClass("completed");
                await updateLoreCount("remove",$(this).attr("data-num"));
            } else {
                $(this).addClass("completed");
                await updateLoreCount("add",$(this).attr("data-num"));
            }
        });

      	$(document).on("click","#resetButton", async function (){
            $("<div>Would you like to reset your progress back to zero?</div>").dialog({
              modal: true,
              title: 'Reset Your Progress',
              zIndex: 10000,
              autoOpen: true,
              width: 'auto',
              resizable: false,
              buttons: [
                {
                  text: "Yes",
                  click: async function() {
                    await updateLoreCount("reset", null);
                    $(this).dialog("close");
                  }
                },
                {
                  text: "Cancel",
                  click: async function() {
                    $(this).dialog("close");
                  }
                }
              ],
              close: async function(event, ui) {
                $(this).remove();
                console.log("close");
              }
            });
        });

        $("#colourBlindMode,#colourBlindModeLabel").click(async function (){
            await switchColourBlindMode($("#colourBlindMode").is(":checked"));
        });
  	});
})();
