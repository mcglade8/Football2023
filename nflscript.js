// Scrape contest data from Draftkings.com for upcoming NFL contests
var corsAPI = "https://cors-anywhere.herokuapp.com/";
var url = "https://www.draftkings.com/lobby/getcontests?sport=NFL";

console.log("If requests fail, may need to go to https://cors-anywhere.herokuapp.com/corsdemo to re-authorize");
async function getContestData(DKSalaries){
    var contestData = [];
    localStorage.DKSalaries = JSON.stringify(DKSalaries);
    // Add contest info from uploaded file to contestData
    var contestDate = document.getElementById("contestDate").value;
    var contestName = document.getElementById("contestName").value;
    for(let i of DKSalaries){
        if('Game' in i) if(i['Game'] != undefined) contestData.push(i);
        if('Game Info' in i) if(i['Game Info'] != undefined) contestData.push(i);
    }
    addSelectOption(contestName, contestDate);
    addTableRows(contestData, contestName, contestDate);
    

}

// Parse game info into date and time
function getGameStartTime(gameInfo){
    let gameTime = gameInfo.split(" ")[2];
    let gameDate = gameInfo.split(" ")[1];
    let gameDateSplit = gameDate.split("/");
    let gameYear = gameDateSplit[2];
    let gameMonth = gameDateSplit[0];
    let gameDay = gameDateSplit[1];
    let gameHour = gameTime.split(":")[0];
    let gameMinute = gameTime.split(":")[1];
    if(gameTime.includes("PM") && gameHour != 12) gameHour = Number(gameHour) + 12;
    // format date for comparison
    let gameString = (gameYear + "-" + gameMonth + "-" + gameDay + "T" + gameHour + ":" + gameMinute).replace("PM", "").replace("AM", "");
    let gameDateObj = new Date(gameString);
    return gameDateObj;
}

/* Deprecated - button removed from html
function updateContestData(){
    var contestData = JSON.parse(localStorage.scrapedContestData);

    addSelectOption(contestData);
    addTableRows(contestData, contestName, contestDate);
    setDefenseProjections();
    saveTableData();
}
*/

/* Deprecated - function no longer used
function removeDuplicates(){
    var table = document.getElementById("contestDataTable");
    var rows = table.rows;
    var players = [];
    var wasRemoved = 0;
    for(let i=1; i<rows.length; i++){
        var r = rows[i-wasRemoved];
        if(!players.includes(r.cells[1].innerHTML.trim()) && !r.cells[8].innerHTML.trim().includes("All slates")){
            players.push(r.cells[1].innerHTML.trim());
        }else{
            table.deleteRow(i-wasRemoved);
            wasRemoved++;
        }
    }
}
*/

// Add event listener to select so that when a new option is selected, the table is updated
function addSelectOption(contestName, contestDate){
    var select = document.getElementById('select');
    // Add a select so user can choose which contest start time to display in a table
    var startTimes = [];
    var options = select.children;
    for(let o of options){
        startTimes.push(o.innerHTML);
    }
    if(startTimes.includes(contestName + " " + contestDate)) return; else {
        var option = document.createElement("option");
        option.innerHTML = contestName + " " + contestDate;
        option.value = contestName + " " + contestDate;
        select.add(option);
    }    
}

// Populates the table with data from contestData
function addTableRows(contestData, contestName, contestDate){
    var table = document.getElementById("contestDataTable");
    var ids = [];
    var rows = table.rows;
    for(let i=0; i < rows.length; i++){
        let r = rows[i];
        if(Number(r.rowIndex)>0) ids.push(r.cells[6].innerHTML.trim());
    }
    for(let p of contestData){
        // If player is already in table, skip it. Otherwise add to playersInList
        if('Id' in p){ 
            p['ID'] = p['Id'];
            p['Name'] = p['Nickname'];
            p['Game Info'] = p['Game'];
            p['TeamAbbrev'] = p['Team'];
            if(p['Team'] == 'JAC') {
                p['TeamAbbrev'] = 'JAX';
                p['Game Info'].replace("JAC", "JAX");
            }
        }
        if(!ids.includes(p['ID'])) {
            ids.push(p['ID'].trim());
            var row = table.insertRow(-1);
            if(p['Game Info'].split(" ")[2] == undefined) row.insertCell(0).innerHTML = (p['Game Info'].split(" ")[0] + " " + contestDate).trim(); else{
                row.insertCell(0).innerHTML = (p['Game Info'].split(" ")[0] + " " + p['Game Info'].split(" ")[2]).trim();
            }
            row.insertCell(1).innerHTML = p['Name'].trim();
            if(p['Roster Position'] == 'FLEX' || p['Roster Position'] == 'CPT') {
                row.insertCell(2).innerHTML = p['Roster Position'].trim();
                if(p['Position'] == 'DST'){ 
                    row.cells[2].setAttribute("defense", "true");
                    row.cells[2].setAttribute("pos", "DST");
                }
                if(p['Position'] == 'K'){ 
                    row.cells[2].setAttribute("kicker", "kicker");
                    row.cells[2].setAttribute("pos", "K");
                }
                if(p['Position'] == 'QB') row.cells[2].setAttribute("pos", "qb");
                if(p['Position'] == 'RB') row.cells[2].setAttribute("pos", "rb");
                if(p['Position'] == 'WR') row.cells[2].setAttribute("pos", "wr");
                if(p['Position'] == 'TE') row.cells[2].setAttribute("pos", "te");

            } else row.insertCell(2).innerHTML = p['Position'].replace("D", "DST").replace("DSTST", "DST").trim();
            row.insertCell(3).innerHTML = p['TeamAbbrev'].trim();
            row.insertCell(4).innerHTML = p['Game Info'].replace("JAC", "JAX").split(" ")[0].replace("@" , "").replace(p['TeamAbbrev'], "").trim();
            row.insertCell(5).innerHTML = p['Salary'].trim();
            row.insertCell(6).innerHTML = p['ID'].trim();
            row.insertCell(7).innerHTML = 0;
            row.insertCell(8).innerHTML = (contestName + " " + contestDate).trim();
            row.insertCell(9).innerHTML = 0;
        }
    }
    clearOldData();
    saveTableData();
    
    location.reload();
}


// Prepare the page once the data is loaded
$(function() {
    if(localStorage.tableData) loadTableData();
    fillTeamSelect();
    getTeamMedians();
    colorTableRows();
    getPlayerMedians();
    getInjuryTable();
    getStealTable();
    getDefenseProjections();
    //updateProjectionsFromMedians();
    adjustProjectionsByInjuries();
    adjustProjectionsByStolen();
    captainize();
    createDatalist();
    addOwnershipProjections();
    fillCashOrGpp();
    fillCashOrGppTeam();
    fillMatchupsTable();
    applyMatchupAdjustments();
    getGroupsFromStorage();
    loadInputs(document.getElementById("builder"));
    loadInputs(document.getElementById("setPlayerMedians"));
});

function updatePlayerProjection(element){
    var newProj = element.value;
    var table = document.getElementById("contestDataTable");
    var rows = table.rows;
    var player = "";
    for(let r of rows){
        if(r.style.backgroundColor == "yellow"){
            r.cells[9].innerHTML = newProj;
            player = r.cells[1].innerHTML;
        }
    }
    if(localStorage.manualProjections) var manualProjections = JSON.parse(localStorage.manualProjections); else var manualProjections = {};
    manualProjections[player] = newProj;
    localStorage.manualProjections = JSON.stringify(manualProjections);
}

// Add ownership projections for classic based on proj/salary (lm from R per position)
function addOwnershipProjections(){
    var table = document.getElementById("contestDataTable");
    var rows = table.rows;
    for(let r of rows){
        if(r.rowIndex == 0) continue;
        let pos = r.cells[2].innerHTML;
        let sal = Number(r.cells[5].innerHTML);
        let proj = Number(r.cells[9].innerHTML);
        let own = 0;
        switch(pos){
            case "QB":
                own = sal*0.00001948 + proj * 0.002175 - sal*proj*0.00000009096 - 0.09357;
                break;
            case "RB":
                own = sal*0.00001045 + proj * 0.008585 - sal*proj*0.0000005783 - 0.05981;
                break;
            case "WR":
                own = -sal*0.000004619 + proj * 0.004165 + sal*proj*0.0000005462 + 0.0000005462;
                break;
            case "TE":
                own = sal*0.000008017 + proj * 0.0002436 + sal*proj*0.000001507 + 0.01475;
                break;
            case "DST":
                own = sal*0.00001948 + proj * 0.002175 + sal*proj*0.00000009096 - 0.09357;
                break;
            default:
                own = 0;
                break;
        }
        own = (own*100).toFixed(1);
        r.insertCell(-1).innerHTML = own;
    }
    
}

// Add ownership projections for showdown based on proj/salary (lm from R per position)
function addOwnershipProjectionsShowdown(){
    var table = document.getElementById("contestDataTable");
    var rows = table.rows;

    // first determine favorites using defenses marked as "FLEX"
    dsts = {};
    for(let r of rows){
        if(r.cells[2].innerHTML != "CPT" && r.cells[2].getAttribute("defense") == "true"){
            dsts[r.cells[3].innerHTML] = {'proj': Number(r.cells[9].innerHTML), 'opp': r.cells[4].innerHTML};
        }
    }
    for(let d of Object.keys(dsts)){
        if(dsts[d].proj > dsts[dsts[d].opp].proj){
            dsts[d].fav = 'true';
        }else{
            dsts[d].fav = 'false';
        }
    }
    for(let r of rows){
        if(r.rowIndex == 0 || !(r.cells[2].innerHTML == "FLEX" || r.cells[2].innerHTML=="CPT")) continue;
        let roster = r.cells[2].innerHTML;
        let Salary = Number(r.cells[5].innerHTML);
        let Projection = Number(r.cells[9].innerHTML);
        let Favorite = Number(dsts[r.cells[3].innerHTML].fav == "true");
        let Pos = r.cells[2].getAttribute("pos").toUpperCase().trim();
        let own = 0;

        switch(roster){
            case "FLEX":
                own = (-36.6437079503806*1)+
                (0.0139095587118555*Salary)+
                (-4.02291460513114*Projection)+
                (19.7249426507333*Favorite)+
                (-1526.23614998061*Number(Pos == "QB"))+
                (36.7362138089681*Number(Pos == "TE"))+
                (26.011692042775*Number(Pos == "RB"))+
                (37.8467870622274*Number(Pos == "WR"))+
                (-104.359934836179*Number(Pos == "K"))+
                (-0.000184081489646198*Salary*Projection)+
                (-0.00128274948779851*Salary*Favorite)+
                (-1.09843964513277*Projection*Favorite)+
                (0.155476695017267*Salary*Number(Pos == "QB"))+
                (4.92435932439896*Projection*Number(Pos == "QB"))+
                (-565.427081865832*Favorite*Number(Pos == "QB"))+
                (-0.00981167707250681*Salary*Number(Pos == "TE"))+
                (4.115880612478*Projection*Number(Pos == "TE"))+
                (-30.5554112719966*Favorite*Number(Pos == "TE"))+
                (-0.011484572613722*Salary*Number(Pos == "RB"))+
                (5.70218137003662*Projection*Number(Pos == "RB"))+
                (12.7709665152522*Favorite*Number(Pos == "RB"))+
                (-0.0147879662035544*Salary*Number(Pos == "WR"))+
                (8.05580456894295*Projection*Number(Pos == "WR"))+
                (-21.9648971087734*Favorite*Number(Pos == "WR"))+
                (0.00828124731679572*Salary*Number(Pos == "K"))+
                (13.8570049625882*Projection*Number(Pos == "K"))+
                (-37.5799712602662*Favorite*Number(Pos == "K"))+
                (0.000273876480134176*Salary*Projection*Favorite)+
                (-0.0000726904417616491*Salary*Projection*Number(Pos == "TE"))+
                (-0.00367791766039892*Salary*Favorite*Number(Pos == "TE"))+
                (4.41882155199908*Projection*Favorite*Number(Pos == "TE"))+
                (0.0000292713421694976*Salary*Projection*Number(Pos == "RB"))+
                (-0.00325612237092727*Salary*Favorite*Number(Pos == "RB"))+
                (-2.87102345192775*Projection*Favorite*Number(Pos == "RB"))+
                (-0.0000963179823632975*Salary*Projection*Favorite*Number(Pos == "TE"))+
                (0.000341769893581981*Salary*Projection*Favorite*Number(Pos == "RB"));
                break;
            case "CPT":
                Salary = Salary/1.5;
                Projection = Projection/1.5;
                own = (-47.1874731041796*1)+
                (0.0154405273879053*Salary)+
                (-4.47296485946932*Projection)+
                (-4.11007975588979*Favorite)+
                (-705.725768536336*Number(Pos == "QB"))+
                (47.4007733963134*Number(Pos == "TE"))+
                (47.5912201436379*Number(Pos == "RB"))+
                (46.9922905399209*Number(Pos == "WR"))+
                (44.8564825155481*Number(Pos == "K"))+
                (0.0000478367190502583*Salary*Projection)+
                (-0.0000373452346114423*Salary*Favorite)+
                (-0.0747789590656364*Projection*Favorite)+
                (0.0680011586937779*Salary*Number(Pos == "QB"))+
                (2.04755422876556*Projection*Number(Pos == "QB"))+
                (-257.266527160406*Favorite*Number(Pos == "QB"))+
                (-0.0149182251313892*Salary*Number(Pos == "TE"))+
                (4.2017400305099*Projection*Number(Pos == "TE"))+
                (3.14450763907458*Favorite*Number(Pos == "TE"))+
                (-0.0155404935310913*Salary*Number(Pos == "RB"))+
                (4.36083295563319*Projection*Number(Pos == "RB"))+
                (20.6225257786639*Favorite*Number(Pos == "RB"))+
                (-0.0156602005605665*Salary*Number(Pos == "WR"))+
                (4.5707168843422*Projection*Number(Pos == "WR"))+
                (4.41086687759223*Favorite*Number(Pos == "WR"))+
                (-0.0173063201127409*Salary*Number(Pos == "K"))+
                (5.81255367475231*Projection*Number(Pos == "K"))+
                (1.57613254986671*Favorite*Number(Pos == "K"))+
                (0.000035883449793357*Salary*Projection*Favorite)+
                (-0.0000570880120235248*Salary*Projection*Number(Pos == "TE"))+
                (-0.000573190515124097*Salary*Favorite*Number(Pos == "TE"))+
                (0.543048813644601*Projection*Favorite*Number(Pos == "TE"))+
                (-0.0000106859203181676*Salary*Projection*Number(Pos == "RB"))+
                (-0.00247964772645314*Salary*Favorite*Number(Pos == "RB"))+
                (-2.81014620276041*Projection*Favorite*Number(Pos == "RB"))+
                (0.00000119340366824209*Salary*Projection*Favorite*Number(Pos == "TE"))+
                (0.000406661288050246*Salary*Projection*Favorite*Number(Pos == "RB"));
                break;
            default:
                break;
        }
        if(Projection == 0 || own <= 0) own = 0;

        r.cells[10].innerHTML = own.toFixed(1);
        
    }

}

// Create datalist of players for search bar
function createDatalist(){
    var datalist = document.createElement("datalist");
    datalist.id = "playersList";

    var table = document.getElementById("contestDataTable");
    var rows = table.rows;
    var names = [];
    for(let r of rows){
        if(!names.includes(r.cells[1].innerHTML.trim())) names.push(r.cells[1].innerHTML.trim());
    }

    for(let n of names){
        var option = document.createElement("option");
        option.value = n;
        datalist.appendChild(option);
    }
    document.body.appendChild(datalist);
}

// Save contestDataTable data for access at a later date
function saveTableData(){
    var table = document.getElementById("contestDataTable");
    var rows = table.rows;
    var tableData = [];
    for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        var rowData = {};
        var firstRow = rows[0];
        for (var j = 0; j < row.cells.length; j++) {
            if(j == 1){
                // remove periods, commas, and apostrophes from player names; remove Jr., Sr., II, III, and IV
                let name = fixName(row.cells[j].innerHTML);
                rowData["Name"] = name;
            }else{
                let info = firstRow.cells[j].innerHTML;
                rowData[info] = row.cells[j].innerHTML;
            }    
        }
        let dst = row.cells[2].getAttribute("defense");
        if(dst != null && dst != undefined && dst != ""){
            rowData["defense"] = dst;
        }
        let k = row.cells[2].getAttribute("kicker");
        if(k != null && k != undefined && k != ""){rowData["kicker"] = k;}
        let x = row.cells[2].getAttribute("pos");
        if(x != null && x != undefined && x != ""){rowData["pos"] = x;}

        tableData.push(rowData);

    }
    localStorage.setItem("tableData", JSON.stringify(tableData));
}

// fix names when saving to table
function fixName(name){
    return name.replaceAll(".", "").replace(",", "").replace("'", "").replace("Jr", "").replace("Sr", "").replace("II", "").replace("III", "").replace("IV", "").trim();
}

// Clear old data from contestDataTable
function clearSaves(){
    localStorage.removeItem("tableData");
    
    location.reload();
}

// Load contestDataTable data from local storage
function loadTableData(){
    var table = document.getElementById("contestDataTable");
    var tableData = JSON.parse(localStorage.getItem("tableData"));
    var firstRow = table.rows[0];
    for (var i = 0; i < tableData.length; i++) {
        var row = table.insertRow(-1);
        for (let c of firstRow.cells) {
            let info = c.innerHTML;
            if(info == "Own") continue;
            row.insertCell(-1).innerHTML = tableData[i][info];
            if(info == "Position"){
                row.cells[2].setAttribute("pos", tableData[i]["pos"]);
                if(tableData[i]["pos"] == "DST") {
                    row.cells[2].setAttribute("defense", "true");
                    row.cells[2].setAttribute("pos", "DST");
                } else if(tableData[i]["pos"] == "K"){ 
                    row.cells[2].setAttribute("kicker", "kicker");
                    row.cells[2].setAttribute("pos", "K");
                } else {
                    row.cells[2].setAttribute("pos", tableData[i]["pos"]);//if(row.length == 11) row.cells[2].setAttribute("pos", tableData[i][j]); else row.cells[2].setAttribute("pos", tableData[i][j]);
                }
            } 

        }
    }
    // Add select options for each contest start time in the table
    var select = document.getElementById('select');

    var startTimes = [];
    var rows = table.rows;
    for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        var startTime = row.cells[8].innerHTML;
        // If start time is already in contestData, skip it. Otherwise add to startTimes
        if (!startTimes.includes(startTime) && !startTime.includes("Tue")) {
            startTimes.push(startTime);
            var option = document.createElement("option");
            option.text = startTime;
            select.add(option);
        }
    }
    document.getElementById('select2').innerHTML = document.getElementById('select').innerHTML;
    document.getElementById('contestSelectCashOrGpp').innerHTML = document.getElementById('select').innerHTML;

    fillPlayerData();
}

// Change displayed information based on button clicked in tabs
var tabButtons = document.getElementsByClassName("tabButton");
for(let b of tabButtons){
    b.addEventListener('click', function(){
        var tabName = b.getAttribute("id").replace("Info", "");
        var content = document.getElementById(tabName);
        var tabs = document.getElementsByClassName("tabContent");
        for(let t of tabs){
            if(t == content){
                t.style.display = "block";
            }else{
                t.style.display = "none";
            }
        }
    })
}

// Add ability to highlight a player and see their median projection on the right side of the screen
function fillPlayerData(){
    // Add event listeners to rows in contestDataTable
    var table = document.getElementById("contestDataTable");
    var rows = table.rows;
    for (var i = 1; i < rows.length; i++) {
        // Update contents of playerSummary table when row is clicked
        rows[i].addEventListener('click', function(){
            var playerSummary = document.getElementById("playerSummary");
            var cells = this.cells;

            playerSummary.rows[0].cells[1].innerHTML = cells[1].innerHTML;
            playerSummary.rows[1].cells[1].innerHTML = cells[2].innerHTML;
            playerSummary.rows[2].cells[1].innerHTML = cells[3].innerHTML;
            playerSummary.rows[3].cells[1].innerHTML = cells[4].innerHTML;
            playerSummary.rows[4].cells[1].innerHTML = cells[5].innerHTML;
            playerSummary.rows[5].cells[1].innerHTML = cells[6].innerHTML;
            playerSummary.rows[6].cells[1].innerHTML = cells[7].innerHTML;
            playerSummary.rows[7].cells[1].innerHTML = cells[8].innerHTML;
            playerSummary.rows[8].cells[1].firstElementChild.value = cells[9].innerHTML;

            // Get defense data from defensesTable for opponent based on Abbr in cells[4]
            var defensesTable = document.getElementById("defensesTable");
            var defensesRows = defensesTable.rows;
            var scoringEffect = "";
            var yardsEffect = "";
            for(let r of defensesRows){
                if(r.cells[1].innerHTML == cells[4].innerHTML){
                    scoringEffect += r.cells[6].innerHTML;
                    yardsEffect += r.cells[7].innerHTML;
                }
            }

            // Highlight row that was clicked
            colorTableRows();
            this.style.backgroundColor = "yellow";
            this.style.color = "black";
            resetInputs(this);
        });
    }
}

// Add event listeners to updateProjections table
// var inputs = document.getElementById("updateProjections").getElementsByTagName("input");
// for(let i of inputs){
//     i.addEventListener('input', function(){
//         updateProjections();
//     })
// }

// Take input from updateProjections to change calcProj.innerHTML
function updateProjections(){
    var calcProj = document.getElementById("calcProj");
    var passingYards = document.getElementById("passingYards").value;
    var passingTDs = document.getElementById("passingTDs").value;
    var interceptions = document.getElementById("interceptions").value;
    var rushingYards = document.getElementById("rushingYards").value;
    var rushingTDs = document.getElementById("rushingTDs").value;
    var receptions = document.getElementById("receptions").value;
    var receivingYards = document.getElementById("receivingYards").value;
    var receivingTDs = document.getElementById("receivingTDs").value;

    var proj = (passingYards * 0.04) + (passingTDs * 4) + (interceptions * -1) + (rushingYards * 0.1) + (rushingTDs * 6) + (receptions * 1) + (receivingYards * 0.1) + (receivingTDs * 6);
    calcProj.innerHTML = proj.toFixed(1);
}

// Reset inputs to 0 when another row is clicked
function resetInputs(r){
    
    var inputs = document.getElementById("updateProjections").getElementsByTagName("input");
    
    if(r.cells[9].getAttribute("projections") != null){
        var projections = JSON.parse(r.cells[9].getAttribute("projections"));
        for(let i of inputs){
            var iParent = i.parentNode;
            var iLabel = iParent.parentElement.firstElementChild.innerHTML.replace(":", "");
            i.value = projections[iLabel];
        }
    }else{
        for(let i of inputs){
            i.value = 0;
        }
    }
    //document.getElementById("calcProj").innerHTML = 0;
    updateProjections();
}


// on click of newProjection, replace Projection with calcProj.innerHTML
function newProjection(){
    var proj = document.getElementById("calcProj").innerHTML;
    var playerSummary = document.getElementById("playerSummary");
    playerSummary.rows[8].cells[1].innerHTML = proj;

    // Save input values to string and store as attribute of row
    var inputs = document.getElementById("updateProjections").getElementsByTagName("input");
    var obj = {};
    for(let i of inputs){
        obj[i.id] = i.value;
    }
    var inputString = JSON.stringify(obj);

    var table = document.getElementById("contestDataTable");
    var rows = table.rows;
    for (var i = 1; i < rows.length; i++) {
        if(rows[i].style.backgroundColor == "yellow"){
            rows[i].cells[9].innerHTML = proj;
            rows[i].cells[9].setAttribute("projections", inputString);
        }
    }
}

// Scrape defense points allowed projections from fantasypros.com
async function getDefenseProjections(){
    let promise = new Promise(function(resolve) {
    defenseProjections = getInfoFromJSON('defenses.json');    
    var table = document.getElementById("defensesTable");
    
    for(let d of Object.keys(defenseProjections)){
        var row = table.insertRow(-1);
        row.insertCell(0).innerHTML = d;
        row.insertCell(1).innerHTML = teamNameToAbbrev(d);
        row.insertCell(2).innerHTML = defenseProjections[d]["Sacks"];
        row.insertCell(3).innerHTML = defenseProjections[d]["Interceptions"];
        row.insertCell(4).innerHTML = defenseProjections[d]["Fumbles Recovered"];
        row.insertCell(5).innerHTML = defenseProjections[d]["Defensive TDs"];
        row.insertCell(6).innerHTML = defenseProjections[d]["Points Allowed"];
        row.insertCell(7).innerHTML = defenseProjections[d]["Yards Allowed"];
    }

    resolve();
    });
    //localStorage.setItem("defenseProjections", JSON.stringify(defenseProjections));
    promise.then(() => setDefenseProjections());
    
}

// Calculate standard deviation
function standardDeviation(values){
    var avg = average(values);
    
    var squareDiffs = values.map(function(value){
        var diff = value - avg;
        var sqrDiff = diff * diff;
        return sqrDiff;
    });
    
    var avgSquareDiff = average(squareDiffs);
    
    var stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
}

// Calculate average
function average(data){
    var sum = data.reduce(function(sum, value){
        return sum + value;
    }, 0);
    
    var avg = sum / data.length;
    return avg;
}

// Load defenseProjections from local storage and add to defensesTable
function loadDefenseProjections(){
    var table = document.getElementById("defensesTable");
    var defenseProjections = JSON.parse(localStorage.getItem("defenseProjections"));
    for(let d of defenseProjections){
        var row = table.insertRow(-1);
        row.insertCell(0).innerHTML = d[0];
        for(let i = 1; i < d.length; i++){
            row.insertCell(i).innerHTML = d[i];
        }
    }
}
//loadDefenseProjections();

// Add column to defensesTable for team abbreviations
function addTeamAbbr(){
    var table = document.getElementById("defensesTable");
    var rows = table.rows;
    for(let r of rows){
        var team = r.cells[0].innerHTML;
        var abbr = teamAbbr(team);
        r.insertCell(1).innerHTML = abbr;
    }
    rows[0].cells[1].innerHTML = "Abbr";
    // Add style from style.css for headers to first row
    rows[0].cells[1].style = "background-color: #4CAF50; color: white;padding: 10px;border: 1px solid #ccc;text-align: center;";
}
addTeamAbbr();

// return team abbreviation from team name
function teamAbbr(team){
    switch(team){
        case "Arizona Cardinals":
            return "ARI";
        case "Atlanta Falcons":
            return "ATL";
        case "Baltimore Ravens":
            return "BAL";
        case "Buffalo Bills":
            return "BUF";
        case "Carolina Panthers":
            return "CAR";
        case "Chicago Bears":
            return "CHI";
        case "Cincinnati Bengals":
            return "CIN";
        case "Cleveland Browns":
            return "CLE";
        case "Dallas Cowboys":
            return "DAL";
        case "Denver Broncos":
            return "DEN";
        case "Detroit Lions":
            return "DET";
        case "Green Bay Packers":
            return "GB";
        case "Houston Texans":
            return "HOU";
        case "Indianapolis Colts":
            return "IND";
        case "Jacksonville Jaguars":
            return "JAX";
        case "Kansas City Chiefs":
            return "KC";
        case "Los Angeles Chargers":
            return "LAC";
        case "Los Angeles Rams":
            return "LAR";
        case "Miami Dolphins":
            return "MIA";
        case "Minnesota Vikings":
            return "MIN";
        case "New England Patriots":
            return "NE";
        case "New Orleans Saints":
            return "NO";
        case "New York Giants":
            return "NYG";
        case "New York Jets":
            return "NYJ";
        case "Las Vegas Raiders":
            return "LV";
        case "Philadelphia Eagles":
            return "PHI";
        case "Pittsburgh Steelers":
            return "PIT";
        case "San Francisco 49ers":
            return "SF";
        case "Seattle Seahawks":
            return "SEA";
        case "Tampa Bay Buccaneers":
            return "TB";
        case "Tennessee Titans":
            return "TEN";
        case "Washington Commanders":
            return "WAS";
    }
}

// Fill teamSelect with teams from contestDataTable
function fillTeamSelect(){
    var table = document.getElementById("contestDataTable");
    var rows = table.rows;
    var teams = [];
    for(let r of rows){
        if(!teams.includes(r.cells[3].innerHTML.trim())){
            if(!r.cells[3].innerHTML.includes("Team")) teams.push(r.cells[3].innerHTML.trim());
        }
    }
    var teamSelect = document.getElementById("teamSelect");
    for(let t of teams){
        var option = document.createElement("option");
        option.text = t;
        teamSelect.add(option);
    }
}

// Show/hide rows based on dropdowns
function getPositionProjections(){
    var position = document.getElementById("positionSelect").value;
    var contestDataTable = document.getElementById("contestDataTable");
    var contestTime = document.getElementById("select").value;
    var team = document.getElementById('teamSelect').value;

    for( let r of contestDataTable.rows){
        if(r.rowIndex == 0) continue;
        var pmatch = false;
        var tmatch = false;
        var teamMatch = false;
        if(position == "All positions") pmatch = true;
        if(r.cells[2].innerHTML == position) pmatch = true;
        if(r.cells[2].getAttribute("kicker") != null) if(position == "K" && r.cells[2].getAttribute("kicker").trim() == "kicker") pmatch = true;
        if(r.cells[2].getAttribute("defense") != null) if(position == "DST" && r.cells[2].getAttribute("defense").trim() == "true") pmatch = true;
        if(r.cells[2].getAttribute("pos") != null) {
            let pos = r.cells[2].getAttribute("pos").toUpperCase();
            if(position == pos) pmatch = true;
        }
        if(r.cells[8].innerHTML == contestTime) tmatch = true;
        if(contestTime.includes("All slates")) tmatch = true;
        if(team == "All teams") teamMatch = true;
        if(r.cells[3].innerHTML == team) teamMatch = true;
        
        if(pmatch && tmatch && teamMatch){
            r.style.display = "";
        }else{
            r.style.display = "none";
        }

    }
}

// tablesorter isn't working on positionTable, so I'm trying to make my own sort function
function sortTable(t, c){
    var table = document.getElementById(t);
    var rows = table.rows;
    var sorted = false;
    while(!sorted){
        sorted = true;
        for(let i = 1; i < rows.length - 1; i++){
            var row1 = rows[i];
            var row2 = rows[i+1];
            if(table.getAttribute('id')== "teamTable"){
                var proj1 = row1.cells[c].getAttribute('proj');
                var proj2 = row2.cells[c].getAttribute('proj');
            }else{
                var proj1 = row1.cells[c].innerHTML;
                var proj2 = row2.cells[c].innerHTML;
            }
            if(Number(proj1) < Number(proj2)){
                sorted = false;
                var temp = row1.innerHTML;
                row1.innerHTML = row2.innerHTML;
                row2.innerHTML = temp;
            }
        }
    }
    colorTableRows();
    getPositionProjections();
    filterCashOrGpp();
}

// Sort contestDataTable by projected points
sortTable("contestDataTable", 9);

// Populate teamInfo table with data from contestDataTable
function populateTeamInfo(){
    var table = document.getElementById("defensesTable");
    var rows = table.rows;
    var teams = [];
    for(let r of rows){
        if(!teams.includes(r.cells[1].innerHTML.trim())){// && r.cells[8].innerHTML == document.getElementById("select").value)){
            if(!r.cells[1].innerHTML.includes("Abbr")) teams.push(r.cells[1].innerHTML.trim());
        }
    }
    var teamObjects = [];
    var contestDataTable = document.getElementById("contestDataTable");
    var cRows = contestDataTable.rows;
    for(let t of teams){
        var teamObject = {"team":t};
        let wasAssigned = {QB: false, RB1: false, RB2: false, WR1: false, WR2:false,WR3:false, TE: false, DST: false};

        for(let r of cRows){
                
                if((r.cells[2].innerHTML.includes("QB") || (r.cells[2].innerHTML == "FLEX" && r.cells[2].getAttribute("pos") == "qb")) && !wasAssigned.QB && r.cells[3].innerHTML == t){
                    teamObject.QB = {player: r.cells[1].innerHTML, proj: r.cells[9].innerHTML, salary: r.cells[5].innerHTML};
                    wasAssigned.QB = true;
                }else if((r.cells[2].innerHTML == "RB"  || (r.cells[2].innerHTML == "FLEX" && r.cells[2].getAttribute("pos") == "rb"))&& !wasAssigned.RB1 && r.cells[3].innerHTML == t){
                    teamObject.RB1 =  {player: r.cells[1].innerHTML, proj: r.cells[9].innerHTML, salary: r.cells[5].innerHTML};
                    wasAssigned.RB1 = true;
                }else if((r.cells[2].innerHTML == "RB"  || (r.cells[2].innerHTML == "FLEX" && r.cells[2].getAttribute("pos") == "rb"))&& !wasAssigned.RB2 && r.cells[3].innerHTML == t){
                    teamObject.RB2 = {player: r.cells[1].innerHTML, proj: r.cells[9].innerHTML, salary: r.cells[5].innerHTML};
                    wasAssigned.RB2 = true;
                }else if((r.cells[2].innerHTML == "WR"  || (r.cells[2].innerHTML == "FLEX" && r.cells[2].getAttribute("pos") == "wr"))&& !wasAssigned.WR1 && r.cells[3].innerHTML == t){
                    teamObject.WR1 =  {player: r.cells[1].innerHTML, proj: r.cells[9].innerHTML, salary: r.cells[5].innerHTML};
                    wasAssigned.WR1 = true;
                }else if((r.cells[2].innerHTML == "WR"  || (r.cells[2].innerHTML == "FLEX" && r.cells[2].getAttribute("pos") == "wr")) && !wasAssigned.WR2 && r.cells[3].innerHTML == t){
                    teamObject.WR2 =  {player: r.cells[1].innerHTML, proj: r.cells[9].innerHTML, salary: r.cells[5].innerHTML};
                    wasAssigned.WR2 = true;
                }else if((r.cells[2].innerHTML == "WR"  || (r.cells[2].innerHTML == "FLEX" && r.cells[2].getAttribute("pos") == "wr"))&& !wasAssigned.WR3 && r.cells[3].innerHTML == t){
                    teamObject.WR3 =  {player: r.cells[1].innerHTML, proj: r.cells[9].innerHTML, salary: r.cells[5].innerHTML};
                    wasAssigned.WR3 = true;
                }else if((r.cells[2].innerHTML == "TE"  || (r.cells[2].innerHTML == "FLEX" && r.cells[2].getAttribute("pos") == "te"))&& !wasAssigned.TE && r.cells[3].innerHTML == t){
                    teamObject.TE =  {player: r.cells[1].innerHTML, proj: r.cells[9].innerHTML, salary: r.cells[5].innerHTML};
                    wasAssigned.TE = true;
                }else if((r.cells[2].innerHTML == "DST"  || r.cells[2].innerHTML == "D" || (r.cells[2].innerHTML == "FLEX" && r.cells[2].getAttribute("defense") == "true"))&& !wasAssigned.DST && r.cells[3].innerHTML == t){
                    teamObject.DST =  {player: r.cells[1].innerHTML, proj: r.cells[9].innerHTML, salary: r.cells[5].innerHTML};
                    wasAssigned.DST = true;
                }

        }
        teamObjects.push(teamObject);
    }
    for(let o of teamObjects){
        if(o.QB != undefined) {
            var teamTable = document.getElementById("teamTable");
            var row = teamTable.insertRow(-1);
            row.insertCell(0).innerHTML = o.team;
            // Add cells for each position and pass the max expectation for that position to colorScale
            row.appendChild(teamTableObjectToCell(o.QB, 35).cloneNode(true));
            row.appendChild(teamTableObjectToCell(o.RB1, 30).cloneNode(true));
            row.appendChild(teamTableObjectToCell(o.RB2, 30).cloneNode(true));
            row.appendChild(teamTableObjectToCell(o.WR1, 30).cloneNode(true));
            row.appendChild(teamTableObjectToCell(o.WR2, 30).cloneNode(true));
            row.appendChild(teamTableObjectToCell(o.WR3, 30).cloneNode(true));
            row.appendChild(teamTableObjectToCell(o.TE, 28).cloneNode(true));
            row.appendChild(teamTableObjectToCell(o.DST, 16).cloneNode(true));

            var totalProj = 0;
            var totalSalary = 0;
            for(let p of Object.values(o)){
                if(p.proj != undefined){
                    totalProj += Number(p.proj);
                    totalSalary += Number(p.salary);
                }
            }
            row.insertCell(9).innerHTML = totalProj.toFixed(1);
            row.insertCell(10).innerHTML = totalSalary;
            row.insertCell(11).innerHTML = (totalProj / totalSalary * 1000).toFixed(1);
        }
    }
    // Sort teamTable by projected points
    sortTable("teamTable", 9);
    
}

function teamTableObjectToCell(obj, max){
    var content = "";
    if(obj != undefined){
        content= obj["player"] + "<br>" + obj["proj"] + "<br>" + obj["salary"];
    }

    var cell = document.createElement('td');
    cell.innerHTML = content;
    cell.setAttribute('proj', obj["proj"]);
    cell.setAttribute('salary', obj["salary"]);
    cell.style.backgroundColor = colorScale(obj["proj"], max);

    return cell;
}

// Add color scale to stylize elements based on their projected points
function colorScale(proj, max){
    var perc = proj / max * 100;
    if(perc > 100) perc = 100;
    var r, g, b = 0;
    if(perc < 50) {
		r = 255;
		g = Math.round(5.1 * perc);
	}
	else {
		g = 255;
		r = Math.round(510 - 5.10 * perc);
	}
	var h = r * 0x10000 + g * 0x100 + b * 0x1;
	return '#' + ('000000' + h.toString(16)).slice(-6);
}

// Add event listener to all table headers to sort table by that column
var tables = document.getElementsByTagName("table");
for(let t of tables){
    var headers = t.getElementsByTagName("th");
    for(let h of headers){
        h.addEventListener('click', function(){
            sortTable(t.id, h.cellIndex);
        })
    }
}

// *** Annual stats expected for NFL teams ***
// Interceptions range from 11-20
// Plays run range from 950-1150
// Rushing yards range from 1500-300
// Rushing TDs range from 5-23
// Passing yards range from 2600-4800
// Passing TDs range from 15-40

// run buildLineups() in a loop but don't start over until all data is loaded
async function iterateBuild(type){
    var lineupsToBuild = Number(document.getElementById("lineupsToBuild").value);
    var allLineups = "";
    if(type=="Classic"){
        for(let i = 0; i < lineupsToBuild; i++){
            allLineups += '<tr>' + buildLineups() +' </tr>';
        }
        document.getElementById("lineupTable").innerHTML = allLineups;
    }else{
        buildShowdownLineups();
        built++;
        if(built < lineupsToBuild){
            iterateBuild(type, built);
        }
    }
}

// Give user feedback while lineups are building
function buildLineupsFeedback(built, lineupsToBuild){
    var buildingLineups = document.getElementById("buildingLineups");
    buildingLineups.style = "display: block; z-index: 1; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(255,255,255,0.8);";
    var lineupProgress = document.getElementById("lineupProgress");
    lineupProgress.innerHTML = "Building lineup " + built + " of " + lineupsToBuild;
}

// Remove previously built lineups onload
localStorage.lineups = "";

// Solve a draftkings lineup for a given contest start time
async function buildLineups(){
    let promise = new Promise(function(resolve) {
    var contestTime = document.getElementById("select").value;
    if(contestTime == "All slates") alert("Please select a slate"); else{
        var lineupsToBuild = Number(document.getElementById("lineupsToBuild").value);
        localStorage.notFeasible = 0; 
        for(let i = 0; i < lineupsToBuild; i++){
            optimizeClassic(generateProjections());
        }
    }
    if(document.getElementById("lineupTable").rows.length == lineupsToBuild + 1){
        resolve('done');
    }
    });
    promise.then(
        (result) => {
            finishOwnership();
        }
    )
}

function filterOwnershipByPosition(){
    var ownershipTable = document.getElementById("ownership");
    var rows = ownershipTable.rows;
    var position = document.getElementById("ownershipPositionFilter").value;
    for(let r of rows){
        if(r.rowIndex == 0) continue;
        if(r.cells[1].innerHTML != position && position != "All positions"){
            r.style.display = "none";
        }else{
            r.style.display = "";
        }
    }
}


// Add positions to ownership table and show player pool size
function finishOwnership(){
    var ownershipTable = document.getElementById("ownership");
    var playerPool = ownershipTable.rows.length-1;
    
    document.getElementById("poolSize").innerHTML = playerPool;

    var ownershipRows = ownershipTable.rows;
    var players = document.getElementById("contestDataTable").rows;
    for(let r of ownershipRows){
        if(r.rowIndex == 0) continue;
        var name = r.cells[0].innerHTML;
        for(let p of players){
            if(p.cells[1].innerHTML == name){
                r.cells[1].innerHTML = p.cells[2].innerHTML;
            }
        }
    }
}

// Randomize projection
function randomizeProjection(projection, position, rushtds, rectds, ptds){
    var isFD = document.querySelector("#contestDataTable > tbody > tr:nth-child(2) > td:nth-child(7)").innerHTML.includes("-");
    var variance = Number(document.getElementById("varianceValue").innerHTML.trim());
    var thisProj = Number(projection);
    if(thisProj <= 0) return 0.5;
    var sd = 0;
    let tdTries = 0;
    let tdChance =0;
    let drives = 0; // impacting projections too aggressively; setting to 0 will allow SD to solely control variance
    rushtds = Number(rushtds);
    rectds = Number(rectds);
    ptds = Number(ptds);

    switch(position){
        case "QB":
            sd = thisProj/30 + 6;
            tdTries = Math.ceil(ptds*drives);
            tdChance = ptds/tdTries;
            for(let i = 0; i < tdTries; i++){
                if(Math.random() < tdChance) thisProj += 4; else thisProj -= 4;
            }
            break;
        case "RB":
            sd = thisProj/2;
            tdTries = Math.ceil(rushtds*drives);
            tdChance = rushtds/tdTries;
            for(let i = 0; i < tdTries; i++){
                if(Math.random() < tdChance) thisProj += 6; else thisProj -= 6;
            }
            tdTries = Math.ceil(rectds*drives);
            tdChance = rectds/tdTries;
            for(let i = 0; i < tdTries; i++){
                if(Math.random() < tdChance) thisProj += 6; else thisProj -= 6;
            }
            break;
        case "WR":
            if(isFD){
                sd = thisProj*.4;
                sd = Math.max(Math.min(thisProj, 6), 2);
            }else{
                sd = thisProj * 0.6;
                sd = Math.max(Math.min(thisProj, 10), 6.5);
            }
            tdTries = Math.ceil(rushtds*drives);
            tdChance = rushtds/tdTries;
            for(let i = 0; i < tdTries; i++){
                if(Math.random() < tdChance) thisProj += 6; else thisProj -= 6;
            }
            tdTries = Math.ceil(rectds*drives);
            tdChance = rectds/tdTries;
            for(let i = 0; i < tdTries; i++){
                if(Math.random() < tdChance) thisProj += 6; else thisProj -= 6;
            }
            break;
        case "TE":
            if(isFD){
                sd = thisProj*.55;
                sd = Math.min(thisProj, 5);
            }else{
                sd = thisProj * 0.8;
                sd = Math.min(thisProj, 10);
            }
            tdTries = Math.ceil(rushtds*drives);
            tdChance = rushtds/tdTries;
            for(let i = 0; i < tdTries; i++){
                if(Math.random() < tdChance) thisProj += 6; else thisProj -= 6;
            }
            tdTries = Math.ceil(rectds*drives);
            tdChance = rectds/tdTries;
            for(let i = 0; i < tdTries; i++){
                if(Math.random() < tdChance) thisProj += 6; else thisProj -= 6;
            }
            break;
        case "DST":
            sd = 7;
            break;
        case "K":
            sd = 5;
            break;
    }

    sd = Number(sd) * (1 + variance/10);
    thisProj = gaussianRandom(thisProj, sd);
    //thisProj = thisProj + Number(sd)*(3*randomNormal()-1.5); ///gaussianRandom(thisProj, sd);

    if(thisProj <= 0) return 0.5;
    return (Number(thisProj)).toFixed(1);
}

// Return a randomized number between 0 and 1 with a normal distribution and mean of .5
function randomNormal(){
    var rand = 0;
    for (var i = 0; i < 6; i += 1) {
        rand += Math.random();
    }
    return rand / 6;
}

// Return a normalized random number with a given mean and sd
function gaussianRandom(mean=0, stdev=1) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}


// Solve a DraftKings classic lineup for a given contest start time
// Solver from https://github.com/JWally/jsLPSolver
function optimizeClassic(players){
    var minStack = Number(document.getElementById("minStack").value);
    var maxStack = Number(document.getElementById("maxStack").value);
    var minCash = Number(document.getElementById("minCash").value);
    var minGPP = Number(document.getElementById("minGpp").value);
    var minboth = minCash + minGPP;
    var cashPlays = [];
    var gppPlays = [];
    if(localStorage.cashPlays != undefined) cashPlays = JSON.parse(localStorage.cashPlays);
    if(localStorage.gppPlays != undefined) gppPlays = JSON.parse(localStorage.gppPlays);
    //var lineup = [];
    //var positions = ["QB", "RB", "RB", "WR", "WR", "WR", "TE", "FLEX", "DST"];
    var minSalary = Number(document.getElementById("minSalaryClassic").value);
    var salaryCap = Number(document.getElementById("maxSalaryClassic").value);
    var minOwnership = Number(document.getElementById("minOwnershipClassic").value);
    var maxOwnership = Number(document.getElementById("maxOwnershipClassic").value);
    
    var QBs = [];
    var RBs = [];
    var WRs = [];
    var TEs = [];
    var FLEXs = [];
    var DSTs = [];
    for(let p of players){
        if(p.proj > Number(document.getElementById("minProjection").value)){
            if(p.position == "QB"){
                QBs.push(p);
            }else if(p.position == "RB"){
                RBs.push(p);
                FLEXs.push(p);
            }else if(p.position == "WR"){
                WRs.push(p);
                FLEXs.push(p);
            }else if(p.position == "TE"){
                TEs.push(p);
                FLEXs.push(p);
            }else if(p.position == "DST"){
                DSTs.push(p);
            }
        }
    }
    var modelVariables = {};
    for(let p of QBs){
        let pid = p.id;
        let pstack = p.team+"QB";
        modelVariables[p.name] = {"proj": p.proj, "salary": p.salary, "QB": 1, "i": 1, "own": p.own};
        modelVariables[p.name][pid] = 1;
        modelVariables[p.name][pstack] = minStack-0.5;
        modelVariables[p.name]["team"] = p.team;
        modelVariables[p.name][p.team+"WRStack"] = 1;
        if(cashPlays.includes(p.name)) modelVariables[p.name]["cash"] = 1;
        if(gppPlays.includes(p.name)) modelVariables[p.name]["gpp"] = 1;
        if(cashPlays.includes(p.name) || gppPlays.includes(p.name)) modelVariables[p.name]["cog"] = 1;
    }
    for(let p of RBs){
        let pid = p.id;
        let pstack = p.team+"QB";
        modelVariables[p.name] = {"id": p.id, "proj": p.proj, "salary": p.salary, "RB": 1, "FLEX": 1, "i": 1, "own": p.own};
        modelVariables[p.name][pid] = 1;
        modelVariables[p.name][pstack] = -1;
        modelVariables[p.name]["team"] = p.team;
        if(cashPlays.includes(p.name)) modelVariables[p.name]["cash"] = 1;
        if(gppPlays.includes(p.name)) modelVariables[p.name]["gpp"] = 1;
        if(cashPlays.includes(p.name) || gppPlays.includes(p.name)) modelVariables[p.name]["cog"] = 1;
    }
    for(let p of WRs){
        let pid = p.id;
        let pstack = p.team+"QB";
        modelVariables[p.name] = {"id": p.id, "proj": p.proj, "salary": p.salary, "WR": 1, "FLEX": 1, "i": 1, "own": p.own};
        modelVariables[p.name][pid] = 1;
        modelVariables[p.name][pstack] = -1;
        modelVariables[p.name]["team"] = p.team;
        modelVariables[p.name][p.team+"WRStack"] = -1;
        if(cashPlays.includes(p.name)) modelVariables[p.name]["cash"] = 1;
        if(gppPlays.includes(p.name)) modelVariables[p.name]["gpp"] = 1;        
        if(cashPlays.includes(p.name) || gppPlays.includes(p.name)) modelVariables[p.name]["cog"] = 1;
    }
    for(let p of TEs){
        let pid = p.id;
        let pstack = p.team+"QB";
        modelVariables[p.name] = {"id": p.id,"proj": p.proj, "salary": p.salary, "TE": 1, "FLEX": 1, "i": 1, "own": p.own};
        modelVariables[p.name][pid] = 1;
        modelVariables[p.name][pstack] = -1;
        modelVariables[p.name]["team"] = p.team;
        modelVariables[p.name][p.team+"WRStack"] = -1;
        if(cashPlays.includes(p.name)) modelVariables[p.name]["cash"] = 1;
        if(gppPlays.includes(p.name)) modelVariables[p.name]["gpp"] = 1;
        if(cashPlays.includes(p.name) || gppPlays.includes(p.name)) modelVariables[p.name]["cog"] = 1;
    }
    for(let p of DSTs){
        let pid = p.id;
        modelVariables[p.name] = {"id": p.id,"proj": p.proj, "salary": p.salary, "DST": 1, "i": 1, "own": p.own};
        modelVariables[p.name][pid] = 1;
        modelVariables[p.name]["team"] = p.team;
        if(cashPlays.includes(p.name)) modelVariables[p.name]["cash"] = 1;
        if(gppPlays.includes(p.name)) modelVariables[p.name]["gpp"] = 1;
        if(cashPlays.includes(p.name) || gppPlays.includes(p.name)) modelVariables[p.name]["cog"] = 1;
    }
    
    var results;
    require(['solver'], function(solver) {
        var model = {
            "optimize": "proj",
            "opType": "max",
            "constraints": {
                "salary": {"max": salaryCap, "min": minSalary},
                "QB": {"equal": 1},
                "RB": {"min": 2},
                "WR": {"min": 3},
                "TE": {"min": 1},
                "FLEX": {"equal": 7},
                "DST": {"equal": 1},
                "i": {"equal": 9},
                "cash": {"min": minCash},
                "gpp": {"min": minGPP},
                "cog": {"min": minboth}, // If a player can be either, still need to meet minCash and minGPP combined total
                "own": {"max": maxOwnership, "min": minOwnership}
            },  
            "variables": modelVariables,
            "ints": {}
        };
        for(let p of Object.keys(modelVariables)){
            let player = modelVariables[p];
            let pid = player['id'];
            if(pid== undefined) continue;

            model.constraints[pid] = {"max": 1};
            model.ints[p] = 1;
            if(!model.constraints[player.team+"QB"]) {
                model.constraints[player.team+"QB"] = {"max": 0, "min": 1-maxStack};
                model.constraints[player.team+"WRStack"] = {"max": '0'};
            }
        }
        results = solver.Solve(model);
        // make sure it's not already in our lineups
        if(!results.feasible) {
            if(localStorage.notFeasible){ 
                let notFeasible = Number(localStorage.notFeasible);
                notFeasible++;
                localStorage.notFeasible = notFeasible;
            } else localStorage.notFeasible = 1;
            if(Number(localStorage.notFeasible) > 10) {
                console.log("No more lineups available");
                return;
            } else optimizeClassic(generateProjections());
        } else {
            var alreadyBuilt = false;
            var thisLineup = [];
            for(let k of Object.keys(results)){
                if(k != "feasible" && k != "result" && k != "bounded" && k != "iterations" && k != "time" && k != "dual" && k != "primal" && k != "isIntegral"){
                    var x=0;
                    while(x < players.length){
                        if(players[x].name.trim() == k.trim()){ 
                            thisLineup.push(players[x].name); 
                        } 
                        x++;
                    }
                    thisLineup = sortArray(thisLineup);
                }
            }
            var builtLineups = getBuiltLineups();
            for(let l of builtLineups){
                if(l == thisLineup) alreadyBuilt = true;
            }
            if(!alreadyBuilt && thisLineup.length == 9) setTimeout(addLineup(results, players), 500); else(optimizeClassic(generateProjections()));
        }
    });
}

// Get lineups that have already been built
function getBuiltLineups(){
    var builtLineups = [];
    var table = document.getElementById("lineupTable");
    var rows = table.rows;
    for(let r of rows){
        if(r.cells[0].innerHTML != "QB"){
            var lineup = [];
            for(let c of r.cells){
                lineup.push(c.innerHTML);
            }
            builtLineups.push(sortArray(lineup));
        }
    }
    return builtLineups;
}

// Add lineup to lineupTable - classic
async function addLineup(lineup,players){

    let promise = new Promise(function(resolve) {
        var lineupTable = document.getElementById("lineupTable");
        var row = lineupTable.insertRow(-1);
        var lineupForTable = [];
        for(let k of Object.keys(lineup)){
            if(k != "feasible" && k != "result" && k != "bounded" && k != "iterations" && k != "time" && k != "dual" && k != "primal" && k != "isIntegral"){
                var found = false, x=0;
                while(!found && x < players.length){
                    if(players[x].name.trim() == k.trim()) found = true; 
                    else x++;
                }
                lineupForTable.push(players[x]);
            }
        }
        // order lineupForTable by position
        var QBs = [];
        var RBs = [];
        var WRs = [];
        var TEs = [];
        var DSTs = [];
        var FLEX = [];
        
        for(let k of Object.keys(lineupForTable)){
            let p = lineupForTable[k];
            if(p.position == "QB"){
                QBs.push(p);
            }else if(p.position == "RB"){
                if(RBs.length == 2) FLEX.push(p); else RBs.push(p);
            }else if(p.position == "WR"){
                if(WRs.length == 3) FLEX.push(p); else WRs.push(p);
            }else if(p.position == "TE"){
                if(TEs.length == 1) FLEX.push(p); else TEs.push(p);
            }else if(p.position == "DST"){
                DSTs.push(p);
            }
        }
        var orderedLineup = [];
        

        for(let p of QBs){
            orderedLineup.push(p);
        }
        for(let p of RBs){
            orderedLineup.push(p);
        }
        for(let p of WRs){
            orderedLineup.push(p);
        }
        for(let p of TEs){
            orderedLineup.push(p);
        }
        for(let p of FLEX){
            orderedLineup.push(p);
        }
        for(let p of DSTs){
            orderedLineup.push(p);
        }
        var totalSalary = 0;
        var totalProj = 0;
        for(let p of orderedLineup){
            var cell = row.insertCell(-1);
            cell.innerHTML = p.name + "<br>" + p.team + "<br>" + p.salary + "<br>" + p.proj;
            totalSalary += Number(p.salary);
            totalProj += Number(p.proj);
        }
        row.insertCell(-1).innerHTML = totalSalary;
        row.insertCell(-1).innerHTML = totalProj.toFixed(1);
        //return row.innerHTML;
        document.getElementById("lineupsBuilt").innerHTML = document.getElementById("lineupTable").rows.length - 1;

        updateOwnership();
        resolve('done');
    });
    promise.then(
        (result) => {
            finishOwnership();
        }
    );
}

// Calculate player ownership based on lineups built and add to ownership table
function updateOwnership(){
    var ownershipTable = document.getElementById("ownership");
    var lineupTable = document.getElementById("lineupTable");
    var rows = lineupTable.rows;
    var players = {};
    for(let r of rows){
        if(r.cells[0].innerHTML == "QB") continue;
        for(let i = 0; i < 9; i++){
            let player = r.cells[i].innerHTML.split("<br>")[0];
            if(players[player] == undefined){
                players[player] = 1;
            }else{
                players[player]++;
            }
        }
    }
    ownershipTable.innerHTML = "<tr><th>Player</th><th>Position</th><th>Ownership</th></tr>";

    for(let p of Object.keys(players)){
        var row = ownershipTable.insertRow(-1);
        row.insertCell(0).innerHTML = p;
        row.insertCell(1).innerHTML = "Loading..."
        row.insertCell(2).innerHTML = (players[p]/(lineupTable.rows.length-1)*100).toFixed(1);
    }
    sortTable("ownership", 2);
}


// Toggle elements based on contest type
function pickBuilder(section){
   
    console.log(section);
    var classicBuilder = document.getElementsByClassName("classicBuilder"); 
    var showdownBuilder = document.getElementsByClassName("showdownBuilder");
    
    
    if(section == "Classic") {
        for(let c of classicBuilder){
            c.style.display = "";
        }
        for(let c of showdownBuilder){
            c.style.display = "none";
        }
        document.getElementById("minCash").value = 9;
        document.getElementById("minGpp").value = 0;
        document.getElementById("groupMin").value = 0;
        document.getElementById("groupMax").value = 0;
    } else{
            
        for(let c of classicBuilder){
            c.style.display = "none";
        }
        for(let c of showdownBuilder){
            c.style.display = "";
        }
        if(section == "FDShowdown"){
            document.getElementById("Showdown").style.display = "none";
            document.getElementById("minCash").value = 5;
            document.getElementById("minGpp").value = 0;
            document.getElementById("groupMin").value = 2;
            document.getElementById("groupMax").value = 4;
            document.getElementById('maxSalaryClassic').value = 58000;
            document.getElementById('minSalaryShowdown').value = 54000;

        }else { 
            document.getElementById("FDShowdown").style.display = "none";
            document.getElementById("minCash").value = 6;
            document.getElementById("minGpp").value = 2;
            document.getElementById("groupMin").value = 3;
            document.getElementById("groupMax").value = 5;
            document.getElementById('maxSalaryClassic').value = 50000;
        }
    }

}

// Create a showdown lineup for a given contest start time
function buildShowdownLineups(){
    var contestTime = document.getElementById("select").value;
    var lineupsToBuild = Number(document.getElementById("lineupsToBuild").value);
    if(contestTime == "All slates") alert("Please select a slate"); else{
        localStorage.notFeasible = 0;
        for(let i = 0; i < lineupsToBuild; i++){
            if(document.getElementById("FDShowdown").style.display == "") optimizeFDShowdown(generateProjections()); else optimizeShowdown(generateProjections());
        }   
    }
}

// Generate new projections
function generateProjections(){
    var contestDataTable = document.getElementById("contestDataTable");
    var contestTime = document.getElementById("select").value;
    var players = [];

    /* Deprecating due to new minProjection feature in optimizeShowdown (needs to be built into optimizeClassic too)
    if(!minProjection.style.display || minProjection.style.display == ""){
        minProjection = Number(minProjection.value);
    } else minProjection = 0; */

    for(let r of contestDataTable.rows){
        if(r.cells[8].innerHTML == contestTime && !r.cells[2].innerHTML.includes("Position")){// && Number(r.cells[9].innerHTML) > minProjection){
            let rushTDOdds = 0;
            let recTDOdds = 0;
            let passTDOdds = 0;
            let rushYards = 0;
            let recYards = 0;
            
            //let newProj = 0;
            let pos = r.cells[2].innerHTML;
            let rosterPosition = pos;
            if(pos == "FLEX" || pos == "CPT"){ 
                pos = r.cells[2].getAttribute("pos").toUpperCase();     
            }
            if(r.cells[9].getAttribute("projections") != null && r.cells[9].getAttribute("projections") != undefined && r.cells[9].getAttribute("projections") != ""){
                let projections = JSON.parse(r.cells[9].getAttribute("projections"));
                rushYards = Number(projections["Rushing Yards"]);
                recYards = Number(projections["Receiving Yards"]);
                rushTDOdds = Number(projections["Rushing TDs"]);
                recTDOdds = Number(projections["Receiving TDs"]);
                passTDOdds = Number(projections["Passing TDs"]);
            } 
            var player = {'name': r.cells[1].innerHTML, 
                'id': r.cells[6].innerHTML, 
                'position': pos, 
                'team': r.cells[3].innerHTML, 
                'opponent': r.cells[4].innerHTML, 
                'salary': r.cells[5].innerHTML, 
                'oldProj': r.cells[9].innerHTML, 
                'rushTDOdds': rushTDOdds, 
                'recTDOdds': recTDOdds, 
                'passTDOdds': passTDOdds, 
                'rushYards': rushYards, 
                'recYards': recYards,
                'rosterPosition': rosterPosition,
                'own': r.cells[10].innerHTML
            };
            
            // Assign a value proj using the randomizeProjection function
            player.proj = randomizeProjection(Number(r.cells[9].innerHTML), pos, rushTDOdds, recTDOdds, passTDOdds);
            // If player.proj is NaN fix it
            
            players.push(player);
           
        }
    }

    //players = correlateByTeam(players);

    return correlateByTeam(players);
}

// Manipulate projections to correlate by team
function correlateByTeam(players){
    var teamProjections = {};
    for(let p of players){
        if(teamProjections[p.team] == undefined){
            let correlateRush= randomNormal() + randomNormal();
            let correlatePass= randomNormal() + randomNormal();

            teamProjections[p.team] = {
                correlateRush: correlateRush,
                correlatePass: correlatePass,
                correlateTeam: (correlateRush + correlatePass)/2,

            };
            if(p.position == "WR" || p.position == "TE"){
                teamProjections[p.team].recProj = p.proj;
                teamProjections[p.team].origRecProj = p.oldProj;
                teamProjections[p.team].rushProj = 0;
                teamProjections[p.team].origRushProj = 0;
            }else if(p.position == "RB") {
                teamProjections[p.team].rushProj = p.proj;
                teamProjections[p.team].origRushProj = p.oldProj;
                teamProjections[p.team].recProj = 0;
                teamProjections[p.team].origRecProj = 0;
            } else{
                teamProjections[p.team].rushProj = 0;
                teamProjections[p.team].origRushProj = 0;
                teamProjections[p.team].recProj = 0;
                teamProjections[p.team].origRecProj = 0;
            }
        } else{
            if(p.position == "WR" || p.position == "TE"){
                let x = Number(teamProjections[p.team].recProj);
                teamProjections[p.team].recProj = x + Number(p.proj);
                let y = Number(teamProjections[p.team].origRecProj);
                teamProjections[p.team].origRecProj = y + Number(p.oldProj);
            }
            if(p.position == "RB"){ 
                let x = Number(teamProjections[p.team].rushProj);
                teamProjections[p.team].rushProj = x + Number(p.proj);
                let y = Number(teamProjections[p.team].origRushProj);
                teamProjections[p.team].origRushProj = y + Number(p.oldProj);
            }
        }

    }
    for(let p of players){
        p.proj = Number(p.proj);
        let teamOrigRushProjWithCorrelate = teamProjections[p.team].origRushProj * teamProjections[p.team].correlateRush; // new team total rb fantasy points
        let teamOrigRecProjWithCorrelate = teamProjections[p.team].origRecProj * teamProjections[p.team].correlatePass; // new team total wr and te fantasy points

        let teamRushProjWithCorrelate = teamProjections[p.team].rushProj; // new team total rb fantasy points
        let teamRecProjWithCorrelate = teamProjections[p.team].recProj; // new team total wr and te fantasy points

        
        switch(p.position){
            case "QB":
                p.proj = (p.proj * (teamProjections[p.team].correlatePass * .8 + teamProjections[p.opponent].correlateTeam * .2)).toFixed(1);
                break;
            case "RB":
                p.proj = (p.proj/teamRushProjWithCorrelate * teamOrigRushProjWithCorrelate).toFixed(1);
                break;
            case "WR":
                p.proj = (p.proj/teamRecProjWithCorrelate * teamOrigRecProjWithCorrelate).toFixed(1);
                break;
            case "TE":
                p.proj = (p.proj/teamRecProjWithCorrelate * teamOrigRecProjWithCorrelate).toFixed(1);
                break;
            case "DST":
                p.proj = (p.proj / (teamProjections[p.opponent].correlateTeam ) / (teamProjections[p.opponent].correlatePass) * (teamProjections[p.team].correlateRush) ).toFixed(1);
                break;
            case "K":
                p.proj = (p.proj * (teamProjections[p.team].correlateTeam)).toFixed(1);
                break;
            default: 
                p.proj = (p.proj * (teamProjections[p.team].correlateTeam)).toFixed(1);
                break;
        }
        if(p.proj <= 0) p.proj = 0;
    }
    return players;
}


// Solve a DraftKings showdown lineup for a given contest start time
function optimizeShowdown(players){
    //setTimeout(function(){return;}, 1000);
    var modelVariables = {};
    var teams = [];
    var minCash = Number(document.getElementById("minCash").value);
    var minGPP = Number(document.getElementById("minGpp").value);
    var maxDarts = Number(document.getElementById("maxDarts").value);
    var minProjection = Number(document.getElementById("minProjection").value);
    var minSalary = Number(document.getElementById("minSalaryShowdown").value);
    var salaryCap = Number(document.getElementById("maxSalaryClassic").value);
    var cashPlays = [];
    var gppPlays = [];
    if(localStorage.cashPlays != undefined) cashPlays = JSON.parse(localStorage.cashPlays);
    if(localStorage.gppPlays != undefined) gppPlays = JSON.parse(localStorage.gppPlays);

    var cptRequire = document.getElementsByName("cptRequire");
    var cptRequireValue = "";
    for(let c of cptRequire){
        if(c.checked) cptRequireValue = c.value;
    }

    for(let p of players){
        //if(p.proj <= 0) continue;
        let n = p.name;
        let t = p.team;
        if(!teams.includes(t)) teams.push(t);
                
        if(p.rosterPosition == "CPT"){
            modelVariables["CPT " + n] = {"proj": p.proj, "salary": p.salary, "CPT": '2', "i": '1'};
            modelVariables["CPT " + n][n] = '1';
            modelVariables["CPT " + n][t] = '1';
            if(p.position == "QB"){
                modelVariables["CPT " + n][t+"QBCPT"] = '1';
            }
            if(cashPlays.includes(n)){
                modelVariables["CPT " + n]["cash"] = '1';
                if(cptRequireValue == "cash" || cptRequireValue == "both" ) modelVariables["CPT " + n]["CPT"] = '1';
            }           
            if(gppPlays.includes(n)){
                modelVariables["CPT " + n]["gpp"] = '1';
                if(cptRequireValue == "gpp" || cptRequireValue == "both") modelVariables["CPT " + n]["CPT"] = '1';
            }
            if(p.oldProj < minProjection){
                modelVariables["CPT " + n]["dart"] = '1';
            }
            if(cptRequireValue == "neither") modelVariables["CPT " + n]["CPT"] = '1';
        }else{
            modelVariables[n] = {"proj": p.proj, "salary": p.salary, "i": '1'};
            modelVariables[n][n] = '1';
            modelVariables[n][t] = '1';
            if(p.position == "WR"){
                modelVariables[n][t+"QBCPT"] = '-1';
            }
            if(cashPlays.includes(n)) modelVariables[n]["cash"] = '1';
            if(gppPlays.includes(n)) modelVariables[n]["gpp"] = '1';
            if(p.oldProj < minProjection){
                modelVariables[n]["dart"] = '1';
            }
        }
        

    }
    // convert CPT proj to 1.5x flex proj
    for(let k of Object.keys(modelVariables)){
        if(k.includes("CPT")){
            let n = k.replace("CPT ", "").trim();
            modelVariables[k]["proj"] = Number(modelVariables[n]["proj"]) * 1.5;
            modelVariables[k]["salary"] = Number(modelVariables[n]["salary"]) * 1.5;
        }
    }
    var results;
    require(['solver'], function(solver) {
        
        var model = {
            "optimize": "proj",
            "opType": "max",
            "constraints": {
                "salary": {"max": salaryCap, "min": minSalary},
                "i": {"equal": 6},
                "CPT": {"equal": 1},
                "cash": {"min": minCash},
                "gpp": {"min": minGPP},
                "dart": {"max": maxDarts}
            },  
            "variables": modelVariables,
            "ints": {}
        };
        for(let k of Object.keys(modelVariables)){
            let p = modelVariables[k];
            model.constraints[p.name] = {"max": '1'};
            //model.constraints[p.team] = {"max": '5'};
            model.constraints[k] = {"max": '1'};
            model.ints[k] = '1';
        }
        for(let t of teams){
            model.constraints[t] = {"max": '5'};
            model.constraints[t+"QBCPT"] = {"max": '0'};
        }

        results = solver.Solve(model);
        // make sure it's not already in our lineups
        if(!results.feasible) {
            if(localStorage.notFeasible){ 
                let notFeasible = Number(localStorage.notFeasible);
                notFeasible++;
                localStorage.setItem('notFeasible', notFeasible); 
            }else localStorage.notFeasible = 1;
            if(Number(localStorage.notFeasible) > 10) {
                console.log("No more lineups available");
                return;
            } else optimizeShowdown(generateProjections());
        } else {
            var alreadyBuilt = false;
            var thisLineup = [];
            var cpt = "";
            for(let k of Object.keys(results)){
                if(k != "feasible" && k != "result" && k != "bounded" && k != "iterations" && k != "time" && k != "dual" && k != "primal" && k != "isIntegral"){
                    if(k.includes("CPT")){
                        cpt = k;
                    }else{
                        thisLineup.push(k);
                    }
                }
            }
            thisLineup = sortArray(thisLineup);
            thisLineup.push(cpt);
            //thisLineup = JSON.stringify(thisLineup);
            var flipLineup = thisLineup;
            //Check if lineup abides by a group rule
            var groupOk = checkForGroup(thisLineup);
            flipLineup[5] = flipLineup[5].replace("CPT ", "");
            var builtLineups = getBuiltShowdownLineups();
            for(let l of builtLineups){
                if(JSON.stringify(l) == JSON.stringify(flipLineup)) alreadyBuilt = true;
            }
            if(!alreadyBuilt && thisLineup.length == 6 && groupOk) setTimeout(addLineupShowdown(thisLineup, modelVariables), 100); else(optimizeShowdown(generateProjections()));
        }
    });
}

// Solve a FanDuel showdown lineup for a given contest start time
async function optimizeFDShowdown(players){
    //setTimeout(function(){return;}, 1000);
    var modelVariables = {};
    var teams = [];
    var minCash = Number(document.getElementById("minCash").value);
    var minGPP = Number(document.getElementById("minGpp").value);
    var maxDarts = Number(document.getElementById("maxDarts").value);
    var minProjection = Number(document.getElementById("minProjection").value);
    var minSalary = Number(document.getElementById("minSalaryShowdown").value);
    var salaryCap = Number(document.getElementById("maxSalaryClassic").value);
    var cashPlays = [];
    var gppPlays = [];
    if(localStorage.cashPlays != undefined) cashPlays = JSON.parse(localStorage.cashPlays);
    if(localStorage.gppPlays != undefined) gppPlays = JSON.parse(localStorage.gppPlays);

    for(let p of players){
        //if(p.proj <= 0) continue;
        let n = p.name;
        let t = p.team;
        if(!teams.includes(t)) teams.push(t);
                
       
        modelVariables[n] = {"proj": p.proj, "salary": p.salary, "i": '1'};
        modelVariables[n][t] = '1';
        if(cashPlays.includes(n)) modelVariables[n]["cash"] = '1';
        if(gppPlays.includes(n)) modelVariables[n]["gpp"] = '1';
        if(p.oldProj < minProjection){
            modelVariables[n]["dart"] = '1';
        }
    }

    var results;
    require(['solver'], function(solver) {
        
        var model = {
            "optimize": "proj",
            "opType": "max",
            "constraints": {
                "salary": {"max": salaryCap, "min": minSalary},
                "i": {"equal": 5},
                "cash": {"min": minCash},
                "gpp": {"min": minGPP},
                "dart": {"max": maxDarts}
            },  
            "variables": modelVariables,
            "binaries": {}
        };
        for(let k of Object.keys(modelVariables)){
            model.constraints[k] = {"max": '1'};
            model.binaries[k] = '1';
        }
        for(let t of teams){
            model.constraints[t] = {"max": '4'};
        }

        results = solver.Solve(model);
        // make sure it's not already in our lineups
        if(!results.feasible) {
            if(localStorage.notFeasible){ 
                let notFeasible = Number(localStorage.notFeasible);
                notFeasible++;
                localStorage.setItem('notFeasible', notFeasible); 
            }else localStorage.notFeasible = 1;
            if(Number(localStorage.notFeasible) > 10) {
                console.log("No more lineups available");
                return;
            } else optimizeFDShowdown(generateProjections());
        } else {
            let promise = new Promise(function(resolve) {
                var thisLineup = [];
                for(let k of Object.keys(results)){
                    if(k != "feasible" && k != "result" && k != "bounded" && k != "iterations" && k != "time" && k != "dual" && k != "primal" && k != "isIntegral"){
                        thisLineup.push(k);
                    }
                }
                resolve(thisLineup);
            });
            promise.then((thisLineup) => {

                return sortByProj(thisLineup, players);
            }).then((sorted) => {
                var alreadyBuilt = false;
                var groupOk = checkForGroup(sorted);
                var builtLineups = getBuiltFDShowdownLineups();
                for(let l of builtLineups){
                    if(JSON.stringify(l) == JSON.stringify(sorted)) alreadyBuilt = true;
                }
                if(!alreadyBuilt && sorted.length == 5 && groupOk) setTimeout(addLineupFDShowdown(sorted, players), 100); else(optimizeFDShowdown(generateProjections()));
            });
        }
    });
}

// Sort array by projection used for FD Showdown
async function sortByProj(lineup, players){
    // set "name" as key for players object
    let promise = new Promise(function(resolve) {
        var fixPlayers = {};
        for(let p of players){
            fixPlayers[p.name] = p;
        }
        resolve(fixPlayers);
    });
    // order lineup by projection
    return promise.then((fixPlayers) => {
        var orderedLineup = [];
        for(let p of lineup){
            orderedLineup.push(fixPlayers[p]);
        }
        orderedLineup.sort(function(a, b){return b.proj - a.proj});
        var newLineup = [];
        for(let p of orderedLineup){
            newLineup.push(p.name);
        }
        return newLineup;
    });
}

// Check if lineup abides by a group rule
function checkForGroup(lineup){
    var groups = JSON.parse(localStorage.getItem("groups"));
    if(groups == null) return true;
    var groupMin = Number(document.getElementById("groupMin").value);
    if(groupMin == 0) return true;
    var groupMax = Number(document.getElementById("groupMax").value);
    for(let group of groups){
        var g = group["players"];
        if(!lineup.includes(g[0])) continue; // if lineup doesn't include first player in group, skip to next group
        var groupCount = 0;
        for(let p = 0; p < lineup.length; p++){
            if(g.includes(lineup[p])) groupCount++;
        }
        if(groupCount >= groupMin && groupCount <= groupMax) return true;
    }
    return false;
}

// Save last inputs for lineup builder
function saveInputs(section){
    var inputs = section.getElementsByTagName("input");
    for(let i of inputs){
        if(i.type == "number" || i.type == "range") localStorage.setItem(i.id, i.value);
        if(i.type == "radio") localStorage.setItem(i.id, i.checked);
    }
}

for(let i of document.getElementById("builder").getElementsByTagName("input")){
    if(i.getAttribute("onchange") == null) i.setAttribute('onchange', 'saveInputs(document.getElementById("builder"))');
}

// Load last inputs for lineup builder
function loadInputs(section){
    var inputs = section.getElementsByTagName("input");
    for(let i of inputs){
        if(localStorage.getItem(i.id) != null){
            if(i.type in ["number", "range"]) i.value = localStorage.getItem(i.id);
            if(i.type == "radio" && localStorage.getItem(i.id) != undefined) i.setAttribute("checked", "");
        }
    }
}




// Sort array alphabetically - using to compare lineups to see if they're already built
function sortArray(arr){
    var sorted = false;
    while(!sorted){
        sorted = true;
        for(let i = 0; i < arr.length-1; i++){
            if(arr[i] > arr[i+1]){
                sorted = false;
                var temp = arr[i];
                arr[i] = arr[i+1];
                arr[i+1] = temp;
            }
        }
    }
    return getUnique(arr);
}

// Delete all lineups from lineupTables
function clearLineups(){
    var lineupTable = document.getElementById("lineupTable");
    var showdownLineupTable = document.getElementById("showdownLineupTable");
    var FDShowdownLineupTable = document.getElementById("FDShowdownLineupTable");
    while(lineupTable.rows.length > 1){
        lineupTable.deleteRow(-1);
    }
    while(showdownLineupTable.rows.length > 1){
        showdownLineupTable.deleteRow(-1);
    }
    while(FDShowdownLineupTable.rows.length > 1){
        FDShowdownLineupTable.deleteRow(-1);
    }
    document.getElementById("lineupsBuilt").innerHTML = 0;
    document.getElementById("showdownLineupsBuilt").innerHTML = 0;
    document.getElementById("FDShowdownLineupsBuilt").innerHTML = 0;
}

// Remove duplicates from array
function getUnique(arr){
    var unique = [];
    for(let a of arr){
        if(!unique.includes(a)) unique.push(a);
    }
    return unique;
}


// Get lineups that have already been built from showdownLineupTable and return an array of names, sorted alphabetically, with CPT at the end
function getBuiltShowdownLineups(){
    var lineups = [];
    var rows = document.getElementById("showdownLineupTable").rows;
    for(let r of rows){
        var lineup = [];
        for(let i = 1; i < 6; i++){
            let name = r.cells[i].innerHTML.split("<br>")[0];
            lineup.push(name);
        }
        lineup = sortArray(lineup);
        let cpt = r.cells[0].innerHTML.split("<br>")[0];
        lineup.push(cpt);
        lineups.push(lineup);
    }
    return lineups;
}

// Get lineups that have already been built from showdownLineupTable and return an array of names, sorted alphabetically, with CPT at the end
function getBuiltFDShowdownLineups(){
    var lineups = [];
    var rows = document.getElementById("FDShowdownLineupTable").rows;
    for(let r of rows){
        var lineup = [];
        for(let i = 0; i < 5; i++){
            let name = r.cells[i].innerHTML.split("<br>")[0];
            lineup.push(name);
        }
        lineups.push(lineup);
    }
    return lineups;
}




// Add lineup to showdownLineupTable
function addLineupShowdown(lineup,players){
    //setTimeout(function(){return;}, 1000);

    var lineupTable = document.getElementById("showdownLineupTable");
    var row = lineupTable.insertRow(-1);
    
    var orderedLineup = [];
    
    for(let i = 0; i< lineup.length; i++){
        players[lineup[5-i]]["name"] = lineup[5-i].replace("CPT ", "");
        orderedLineup.push(players[lineup[5-i]]);
    }

    let totalProj = 0;
    let totalSalary = 0;
    for(let p of orderedLineup){
        var cell = row.insertCell(-1);
        let name = p.name.replace("CPT ", "");
        let team = "";
        for(let k of Object.keys(p)){
            if((k.length == 3 || k.length == 2) && k != "CPT" && k != "gpp") team = k;
        }
        if(cell.cellIndex==0) {
            p.salary = Number(p.salary) * 1.5;
            p.proj = Number(p.proj) * 1.5;
        }
        
        cell.innerHTML = name + "<br>" + team + "<br>" + Number(p.salary) + "<br>" + Number(p.proj).toFixed(1);
        totalSalary += Number(p.salary);
        totalProj += Number(p.proj);
    }
    row.insertCell(-1).innerHTML = totalSalary;
    row.insertCell(-1).innerHTML = totalProj.toFixed(1);

    // Update ShowdownLineupsBuilt to num rows -1
    document.getElementById("showdownLineupsBuilt").innerHTML = lineupTable.rows.length-1;

    updateShowdownOwnership();
}

function addLineupFDShowdown(lineup,players){
    for(let p of players){
        players[p.name] = p;
    }
    //setTimeout(function(){return;}, 1000);

    var lineupTable = document.getElementById("FDShowdownLineupTable");
    var row = lineupTable.insertRow(-1);
    
    var orderedLineup = [];
    
    for(let i = 0; i< lineup.length; i++){
        orderedLineup.push(players[lineup[i]]);
    }

    let totalProj = 0;
    let totalSalary = 0;
    for(let p of orderedLineup){
        var cell = row.insertCell(-1);
        let name = p.name;
        let team = p.team;
        if(cell.cellIndex==0) {
            p.proj = Number(p.proj) * 1.5;
        }
        
        cell.innerHTML = name + "<br>" + team + "<br>" + Number(p.salary) + "<br>" + Number(p.proj).toFixed(1);
        totalSalary += Number(p.salary);
        totalProj += Number(p.proj);
    }
    row.insertCell(-1).innerHTML = totalSalary;
    row.insertCell(-1).innerHTML = totalProj.toFixed(1);

    // Update ShowdownLineupsBuilt to num rows -1
    document.getElementById("FDShowdownLineupsBuilt").innerHTML = lineupTable.rows.length-1;

    updateFDShowdownOwnership();
}

// Update ownership for showdown lineups
function updateShowdownOwnership(){
    var table = document.getElementById("showdownLineupTable");
    var rows = table.rows;
    
    var players ={};
    for(let r of rows){
        if(r.rowIndex == 0) continue;
        for(let i = 1; i < 6; i++){
            let name = r.cells[i].innerHTML.split("<br>")[0];
            if(!Object.keys(players).includes(name)) {
                // Create object with key 'name' and values 'flex' and 'cpt'
                players[name] = {"flex":1, "cpt": 0};
            } else{
                players[name]["flex"]++;
            }
        }
        let cpt = r.cells[0].innerHTML.split("<br>")[0];
        if(!Object.keys(players).includes(cpt)){
            // Create object with key 'name' and values 'flex' and 'cpt'
            players[cpt] = {"flex": 0, "cpt": 1};            
        } else{
            players[cpt]["cpt"]++;
        }
    }
    var ownershipTable = document.getElementById("showdownOwnership");
    while(ownershipTable.rows.length > 1){
        ownershipTable.deleteRow(-1);
    }
    for(let p of Object.keys(players)){
        if(players[p].flex > 0 || players[p].cpt > 0){
            var row = ownershipTable.insertRow(-1);
            row.insertCell(-1).innerHTML = p;
            row.insertCell(-1).innerHTML = (players[p].cpt/(table.rows.length-1)*100).toFixed(1);
            row.insertCell(-1).innerHTML = (players[p].flex/(table.rows.length-1)*100).toFixed(1);
            row.insertCell(-1).innerHTML = ((players[p].cpt+players[p].flex)/(table.rows.length-1)*100).toFixed(1);
        }
    }
    sortTable("showdownOwnership", 3);
}

// Update ownership for showdown lineups
function updateFDShowdownOwnership(){
    var table = document.getElementById("FDShowdownLineupTable");
    var rows = table.rows;
    
    var players ={};
    for(let r of rows){
        if(r.rowIndex == 0) continue;
        for(let i = 1; i < 5; i++){
            let name = r.cells[i].innerHTML.split("<br>")[0];
            if(!Object.keys(players).includes(name)) {
                // Create object with key 'name' and values 'flex' and 'mvp'
                players[name] = {"flex":1, "mvp": 0};
            } else{
                players[name]["flex"]++;
            }
        }
        let mvp = r.cells[0].innerHTML.split("<br>")[0];
        if(!Object.keys(players).includes(mvp)){
            // Create object with key 'name' and values 'flex' and 'mvp'
            players[mvp] = {"flex": 0, "mvp": 1};            
        } else{
            players[mvp]["mvp"]++;
        }
    }
    var ownershipTable = document.getElementById("FDShowdownOwnership");
    while(ownershipTable.rows.length > 1){
        ownershipTable.deleteRow(-1);
    }
    for(let p of Object.keys(players)){
        if(players[p].flex > 0 || players[p].mvp > 0){
            var row = ownershipTable.insertRow(-1);
            row.insertCell(-1).innerHTML = p;
            row.insertCell(-1).innerHTML = (players[p].mvp/(table.rows.length-1)*100).toFixed(1);
            row.insertCell(-1).innerHTML = (players[p].flex/(table.rows.length-1)*100).toFixed(1);
            row.insertCell(-1).innerHTML = ((players[p].mvp+players[p].flex)/(table.rows.length-1)*100).toFixed(1);
        }
    }
    sortTable("FDShowdownOwnership", 3);
}

// Add variance to lineup builder based on slider value
function updateSlider(){
    var slider = document.getElementById("varianceSlider");
    var variance = slider.value;
    document.getElementById("varianceValue").innerHTML = variance;
}

// Causes slate change from "Builder" tab to update "Contest Info" tab
async function updateOtherSelect(){
    var otherSelect = document.getElementById("select2").value;
    document.getElementById("select").value = otherSelect;
    var isFDShowdown = await checkForFanduel(otherSelect);

    var rows = document.getElementById("contestDataTable").rows;
    var i = 0;
    var found = false;
    while(!found){
        if(rows[i].cells[8].innerHTML == otherSelect){
            found = true;
        }else{
            i++;
        }
    }
    if(rows[i].cells[2].innerHTML == "CPT" || rows[i].cells[2].innerHTML == "FLEX") {
        pickBuilder('Showdown');
    }else if(isFDShowdown){
        pickBuilder('FDShowdown');
    }else{
        pickBuilder('Classic');
    }
}



// Check if contest is a FanDuel contest
async function checkForFanduel(contest){
    let promise = new Promise(function(resolve) {
            var rows = document.getElementById("contestDataTable").rows;
            var teams = [];
            for(let i of rows){
                if(i.cells[8].innerHTML == contest){
                    if(i.cells[2].innerHTML == "CPT" || i.cells[2].innerHTML == "FLEX") resolve(false);
                    if(!teams.includes(i.cells[3].innerHTML)) teams.push(i.cells[3].innerHTML);
                    
                }
            }
            if(teams.length > 2) resolve(false); else resolve(true);
        });
    var result = await promise;
    return result;
}
    

// Get player medians from storage, if it exists
function getPlayerMedians(){
    var players = document.getElementById("contestDataTable").rows;
    var playerMedians = getInfoFromJSON('player_projections.json');
    var teams = [];
    var list = [];
    /*for(let p of players){
        
        if(p.cells[1].innerHTML != "Player"){
            if(!list.includes(p.cells[1].innerHTML.trim())){
                list.push(p.cells[1].innerHTML.trim());
            
                var name = p.cells[1].innerHTML;
                if(name in playerMedians){
                    var row = table.insertRow(-1);
                    for(let t of ths){
                        if(["Game", "Name", "Position", "Team"].includes(t.innerHTML)) {
                            var cell = row.insertCell(-1);
                            cell.innerHTML = p.cells[t.cellIndex].innerHTML;
                        }else{
                            var cell = row.insertCell(-1);
                            cell.innerHTML = '<label for="'+name+t.innerHTML+'Slider">'+playerMedians[name][t.innerHTML]+'</label><input type="range" min="0" max="100" value="'+playerMedians[name][t.innerHTML]+'" class="slider" id="'+name+t.innerHTML+'Slider" oninput="updateProjectionSlider(this.id)">';
                        }   
                    }
                } else{
                    var row = table.insertRow(-1);
                    for(let t of ths){
                        if(["Game", "Name", "Position", "Team"].includes(t.innerHTML)) {
                            var cell = row.insertCell(-1);
                            cell.innerHTML = p.cells[t.cellIndex].innerHTML;
                        }else{
                            var cell = row.insertCell(-1);
                            cell.innerHTML = '<label for="'+name+t.innerHTML+'Slider">0</label><input type="range" min="0" max="100" value="0" class="slider" id="'+name+t.innerHTML+'Slider" oninput="updateProjectionSlider(this.id)">';
                        }
                    }
                }
            }

        }
    }*/

    var kickers = getInfoFromJSON('kickers.json');
    var defenses = getInfoFromJSON('sacks.json');
    var matchupAdjustments = localStorage.matchupsTableData ? JSON.parse(localStorage.matchupsTableData) : {};
    if(localStorage.manualProjections) var manualProjections = JSON.parse(localStorage.manualProjections); else var manualProjections = {};
    // update PPG column in contestDataTable based on values in playerMedians
    for(let p of players){
        var matchupMultiplier = 1;
        if(!teams.includes(p.cells[3].innerHTML.trim()) && p.cells[1].innerHTML != "Player"){
            teams.push(p.cells[3].innerHTML.trim());
        }
        if(p.cells[1].innerHTML != "Name"){
            var name = p.cells[1].innerHTML;
            let team = p.cells[3].innerHTML;
            let opp = p.cells[4].innerHTML;
            if(opp == "LAR") opp = "LA";
            if(team == "LAR") team = "LA";
            if(name in manualProjections){
                p.cells[9].innerHTML = manualProjections[name];
            }else if(name in playerMedians){
                if(team in matchupAdjustments){
                    matchupMultiplier = 1 + matchupAdjustments[team]["slider"]/100;
                }
                p.cells[9].innerHTML = playerMedians[name];
                if(p.cells[6].innerHTML.includes("-") && ["WR", "TE"].includes(p.cells[2].innerHTML)) p.cells[9].innerHTML = Number(p.cells[9].innerHTML) * 0.9 * matchupMultiplier;
            }else if(name in kickers){
                p.cells[7].innerHTML = kickers[name]["FPS"];
                p.cells[9].innerHTML = kickers[name]["FPS"];
            }else if(team in defenses && p.cells[2].innerHTML == "DST") {
                if(opp in matchupAdjustments){
                    matchupMultiplier = 1 - matchupAdjustments[opp]["slider"]/100;
                }
                p.cells[9].innerHTML = (2.7142 * defenses[team]["sacks_earned"] + 3.1666 * defenses[opp]["sacks_allowed"] - 5.6074) * matchupMultiplier;
            }else{
                p.cells[7].innerHTML = 0;
                p.cells[9].innerHTML = 0;
            }
        }
    }
    teams = teams.sort();
    var teamSelect = document.getElementById("teamSelect");
    for(let t of teams){
        var option = document.createElement("option");
        option.text = t;
        teamSelect.add(option);
    }
}

function resetProjections(){
    localStorage.removeItem("manualProjections");
    location.reload();
}
// Convert team abbrev to name
function teamAbbrevToName(team){
    switch(team){
        case "ARI":
            return "Arizona Cardinals";
        case "ATL":
            return "Atlanta Falcons";
        case "BAL":
            return "Baltimore Ravens";
        case "BUF":
            return "Buffalo Bills";
        case "CAR":
            return "Carolina Panthers";
        case "CHI":
            return "Chicago Bears";
        case "CIN":
            return "Cincinnati Bengals";
        case "CLE":
            return "Cleveland Browns";
        case "DAL":
            return "Dallas Cowboys";
        case "DEN":
            return "Denver Broncos";
        case "DET":
            return "Detroit Lions";
        case "GB":
            return "Green Bay Packers";
        case "HOU":
            return "Houston Texans";
        case "IND":
            return "Indianapolis Colts";
        case "JAX":
            return "Jacksonville Jaguars";
        case "JAC":
            return "Jacksonville Jaguars";
        case "KC":
            return "Kansas City Chiefs";
        case "LAC":
            return "Los Angeles Chargers";
        case "LAR":
            return "Los Angeles Rams";
        case "MIA":
            return "Miami Dolphins";
        case "MIN":
            return "Minnesota Vikings";
        case "NE":
            return "New England Patriots";
        case "NO":
            return "New Orleans Saints";
        case "NYG":
            return "New York Giants";
        case "NYJ":
            return "New York Jets";
        case "LV":
            return "Las Vegas Raiders";
        case "PHI":
            return "Philadelphia Eagles";
        case "PIT":
            return "Pittsburgh Steelers";
        case "SEA":
            return "Seattle Seahawks";
        case "SF":
            return "San Francisco 49ers";
        case "TB":
            return "Tampa Bay Buccaneers";
        case "TEN":
            return "Tennessee Titans";
        case "WAS":
            return "Washington Commanders";
    }
}


// Update feedback for slider input
function updateProjectionSlider(id){
    var slider = document.getElementById(id);
    if(slider == null) return;
    var label = slider.previousElementSibling;
    label.innerHTML = slider.value;
    populateSumOfLabels();
}


// Get team medians
function getTeamMedians(){
    var table = document.getElementById("teamMediansTable");
    var players = document.getElementById("contestDataTable").rows;

    // get teamMedians from teamMedians.js file
    var teamMedians = getInfoFromJSON('teamMedians.json');
    
    // Change team name to team abbrev with teamNameToAbbrev function
    for(let k of Object.keys(teamMedians)){
        teamMedians[teamNameToAbbrev(k)] = teamMedians[k];
        delete teamMedians[k];
    }
    var teams = [];
    for(let p of players){
        if(!teams.includes(p.cells[3].innerHTML.trim()) && p.cells[1].innerHTML != "Player"){
            teams.push(p.cells[3].innerHTML.trim());
        }
    }
    for(let t of teams){
        if(teamMedians[t] == undefined || t == "Team") continue; 
        var row = table.insertRow(-1);
        var cell = row.insertCell(-1);
        cell.innerHTML = t;
        row.insertCell(-1).innerHTML = "<input type='number' value='"+teamMedians[t]["Passing Yards"]+"' id='"+t+"Passing YardsProj'>";
        row.insertCell(-1).innerHTML = "<input type='number' value='"+teamMedians[t]["Passing TDs"]+"' id='"+t+"Passing TDsProj'>";
        row.insertCell(-1).innerHTML = "<input type='number' value='"+teamMedians[t]["Interceptions"]+"' id='"+t+"InterceptionsProj'>";
        row.insertCell(-1).innerHTML = "<input type='number' value='"+teamMedians[t]["Receptions"]+"' id='"+t+"ReceptionsProj'>";
        row.insertCell(-1).innerHTML = "<input type='number' value='"+teamMedians[t]["Receiving Yards"]+"' id='"+t+"Receiving YardsProj'>";
        row.insertCell(-1).innerHTML = "<input type='number' value='"+teamMedians[t]["Receiving TDs"]+"' id='"+t+"Receiving TDsProj'>";
        row.insertCell(-1).innerHTML = "<input type='number' value='"+teamMedians[t]["Rushing Yards"]+"' id='"+t+"Rushing YardsProj'>";
        row.insertCell(-1).innerHTML = "<input type='number' value='"+teamMedians[t]["Rushing TDs"]+"' id='"+t+"Rushing TDsProj'>";
        

    }

}

// Get info from JSON file
function getInfoFromJSON(file){
    var json = {};
    $.ajax({
        'async': false,
        'global': false,
        'url': file,
        'dataType': "json",
        'success': function (data) {
            json = data;
        }
    });
    return json;
}

// Replace team name with team abbreviation
function teamNameToAbbrev(team){
    switch(team){
        case "Arizona Cardinals":
            return "ARI";
        case "Atlanta Falcons":
            return "ATL";
        case "Baltimore Ravens":
            return "BAL";
        case "Buffalo Bills":
            return "BUF";
        case "Carolina Panthers":
            return "CAR";
        case "Chicago Bears":
            return "CHI";
        case "Cincinnati Bengals":
            return "CIN";
        case "Cleveland Browns":
            return "CLE";
        case "Dallas Cowboys":
            return "DAL";
        case "Denver Broncos":
            return "DEN";
        case "Detroit Lions":
            return "DET";
        case "Green Bay Packers":
            return "GB";
        case "Houston Texans":
            return "HOU";
        case "Indianapolis Colts":
            return "IND";
        case "Jacksonville Jaguars":
            return "JAX";
        case "Kansas City Chiefs":
            return "KC";
        case "Los Angeles Chargers":
            return "LAC";
        case "Los Angeles Rams":
            return "LAR";
        case "Miami Dolphins":
            return "MIA";
        case "Minnesota Vikings":
            return "MIN";
        case "New England Patriots":
            return "NE";
        case "New Orleans Saints":
            return "NO";
        case "New York Giants":
            return "NYG";
        case "New York Jets":
            return "NYJ";
        case "Las Vegas Raiders":
            return "LV";
        case "Philadelphia Eagles":
            return "PHI";
        case "Pittsburgh Steelers":
            return "PIT";
        case "San Francisco 49ers":
            return "SF";
        case "Seattle Seahawks":
            return "SEA";
        case "Tampa Bay Buccaneers":
            return "TB";
        case "Tennessee Titans":
            return "TEN";
        case "Washington Commanders":
            return "WAS";
    }
}

// Update team medians in storage
function updateTeamMedians(){
    var table = document.getElementById("teamMediansTable");
    var rows = table.rows;
    var teamMedians = {};
    for(let r of rows){
        if(r.rowIndex == 0) continue;
        var team = r.cells[0].innerHTML;
        teamMedians[team] = {};
        var ths = table.getElementsByTagName("th");
        for(let t of ths){
            if(t.innerHTML == "Team") continue;
            var input = document.getElementById(team+t.innerHTML+"Proj");
            teamMedians[team][t.innerHTML] = input.value;
        }
    }
    localStorage.teamMedians = JSON.stringify(teamMedians);
    saveToFile(localStorage.teamMedians, "teamMedians.txt");
}

// Save to local file in case local storage is deleted
function saveToFile(content, filename){
    var file = new Blob([content], {type: "text/plain;charset=utf-8"});
    var a = document.createElement("a");
    var url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    a.click();
}


// Update player projections within Contest Info based on team medians and player medians
function updateProjectionsFromMedians(){
    var players = document.getElementById("contestDataTable");
    var rows = players.rows;

    var playerMedians = getInfoFromJSON('playerMedians.json');
    var teamMedians = getInfoFromJSON('teamMedians.json');

    for(let t of Object.keys(teamMedians)){
        teamMedians[teamNameToAbbrev(t)] = teamMedians[t];
        delete teamMedians[t];
    }

    //var teamMedians = JSON.parse(localStorage.teamMedians);
    //var playerMedians = JSON.parse(localStorage.playerMedians);
    var ths = document.getElementById('teamMediansTable').getElementsByTagName('th');
    var categories = [];
    for(let th of ths){
        if(th.innerHTML == "Team") continue;
        categories.push(th.innerHTML);
    }
    for(let r of rows){
        if(r.rowIndex == 0) continue;
        var team = r.cells[3].innerHTML.trim();
        var player = r.cells[1].innerHTML.trim();
        

        if(player in playerMedians){
            var playerProjections = playerMedians[player];
            var teamProjections = teamMedians[team];
            var newProjections = {};
            //console.log(player);
            for(let c of categories){
                if(playerProjections[c] == undefined || teamProjections[c] == undefined){
                    newProjections[c] = 0;
                } else{
                    newProjections[c] = Number(playerProjections[c]) * Number(teamProjections[c])/100;
                }
            }

           // r.cells[9].setAttribute("projections", JSON.stringify(newProjections));
           // r.cells[9].innerHTML = ((newProjections["Passing Yards"] * 0.04) + (newProjections["Passing TDs"] * 4) + (newProjections["Interceptions"] * -1) + (newProjections["Rushing Yards"] * 0.1) + (newProjections["Rushing TDs"] * 6) + (newProjections["Receptions"] * 1) + (newProjections["Receiving Yards"] * 0.1) + (newProjections["Receiving TDs"] * 6)).toFixed(1);
        }
    }
    adjustProjectionsByDefense();
    
}

// Add event listener to dksalaries upload button to run handlecsv when file is loaded
document.getElementById("dksalaries").addEventListener("change", function(){handlecsv("dksalaries")});


//var DKSalaries = "";
function handlecsv(element){
    var csv = document.getElementById(element).files[document.getElementById(element).files.length-1];
    var reader = new FileReader();
    // save csv to storage as JSON
    reader.onload = function(e){
        var csv = e.target.result;
        var lines = csv.split("\n");
        var result = [];
        var headers = lines[0].split(",");
        for(let i = 1; i < lines.length; i++){
            var obj = {};
            var currentline = lines[i].split(",");
            for(let j = 0; j < headers.length; j++){
                obj[headers[j]] = currentline[j];
            }
            result.push(obj);
        }
        //localStorage.contestData = JSON.stringify(result);
        //location.reload();
        //DKSalaries = result;//JSON.stringify(result);
        getContestData(result);

    }
    reader.readAsText(csv);

}

function handleTXT(name){
    var file = document.getElementById(name).files[0];
    var reader = new FileReader();
    reader.onload = function(e){
        var txt = e.target.result;
        localStorage[name] = txt;
        //return(JSON.parse(txt));
        getPlayerMedians();
        getTeamMedians();
        //location.reload();
    }
    reader.readAsText(file);
}


// Download lineups from builder as CSV 
function downloadLineupsShowdown(){
    if(document.querySelector("#FDShowdown").style.display == "none"){
        var lineups = document.getElementById("showdownLineupTable").rows;
        var csv = "data:text/csv;charset=utf-8,";
        csv += "CPT,FLEX,FLEX,FLEX,FLEX,FLEX\n";
        for(let l of lineups){
            if(l.rowIndex == 0) continue;
            var row = [];
            for(let c of l.cells){
                if(c.cellIndex > 5) continue;
                var cell = c.innerHTML;
                var position = "FLEX";
                if(c.cellIndex == 0){
                    position = "CPT";
                }
                var name = cell.split("<br>")[0].replace("CPT ", "").trim();
                row.push(getIdFromUpload(name, position));
            }
            csv += row.join(",") + "\n";
        }
        var encodedUri = encodeURI(csv);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "lineups.csv");
        document.body.appendChild(link);
        link.click();
    }else{
        var lineups = document.getElementById("FDShowdownLineupTable").rows;
        var csv = "data:text/csv;charset=utf-8,";
        csv += "MVP - 1.5X Points,AnyFLEX,AnyFLEX,AnyFLEX,AnyFLEX\n";
        for(let l of lineups){
            if(l.rowIndex == 0) continue;
            var row = [];
            for(let c of l.cells){
                if(c.cellIndex > 4) continue;
                var cell = c.innerHTML;
                var position = "FD";
                var name = cell.split("<br>")[0].trim();
                row.push(getIdFromUpload(name, position));
            }
            csv += row.join(",") + "\n";
        }
        var encodedUri = encodeURI(csv);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "lineups.csv");
        document.body.appendChild(link);
        link.click();
    }
}

// Download lineups from builder as CSV
function downloadLineups(){
    var lineups = document.getElementById("lineupTable").rows;
    var csv = "data:text/csv;charset=utf-8,";
    if(document.getElementById('maxSalaryClassic').value > 50000) csv += "QB,RB,RB,WR,WR,WR,TE,FLEX,DEF\n"; else csv += "QB,RB,RB,WR,WR,WR,TE,FLEX,DST\n";
    for(let l of lineups){
        if(l.rowIndex == 0) continue;
        var row = [];
        for(let c of l.cells){
            if(c.cellIndex > 8) continue;
            var cell = c.innerHTML;
            var position = "FLEX";
            if(c.cellIndex == 0){
                position = "QB";
            }else if(c.cellIndex == 1 || c.cellIndex == 2){
                position = "RB";
            }else if(c.cellIndex == 3 || c.cellIndex == 4 || c.cellIndex == 5){
                position = "WR";
            }else if(c.cellIndex == 6){
                position = "TE";
            }else if(c.cellIndex == 7){
                position = "FLEX";
            }else if(c.cellIndex == 8){
                position = "DST";
            }
            var name = cell.split("<br>")[0].replace("CPT ", "").trim();
            row.push(getIdFromUpload(name, position));
        }
        csv += row.join(",") + "\n";
    }
    var encodedUri = encodeURI(csv);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "lineups.csv");
    document.body.appendChild(link);
    link.click();
}

// Get player ID from upload based on name and position
function getIdFromUpload(name, position){
    var table = document.getElementById("contestDataTable");
    var rows = table.rows;
    var found = false;
    var x = 0;
    while(!found){
        if(rows[x].cells[1].innerHTML == name && (position == "FD" || rows[x].cells[2].innerHTML == position || (position == "FLEX" && (rows[x].cells[2].innerHTML == "RB" || rows[x].cells[2].innerHTML == "WR" || rows[x].cells[2].innerHTML == "TE")))){
            found = true;
        }else{
            x++;
        }
    }
    return rows[x].cells[6].innerHTML;
}

// Place DKEntries into localStorage for use in builder
var DKEntries = "";

function handleLineupscsv(){
    var csv = document.getElementById("editcsv").files[0];
    var reader = new FileReader();
    // save csv to storage as JSON
    reader.onload = function(e){
        var csv = e.target.result;
        var lines = csv.split("\n");
        var result = [];
        var headers = lines[0].split(",");
        for(let i = 0; i < lines.length; i++){
            var obj = [];
            var currentline = lines[i].split(",");
            for(let j = 0; j < headers.length; j++){
                obj[j] = currentline[j];
            }
            result.push(obj);
        }
        //localStorage.DKEntries = JSON.stringify(result);
        //return result;
        //return(JSON.stringify(result));
        //location.reload();
        DKEntries = JSON.stringify(result);
    }
    reader.readAsText(csv);

}

function downloadEditedLineupsShowdown(){
    if(document.querySelector("#FDShowdownLineupTable > thead > tr:nth-child(1) > th:nth-child(1)").innerHTML == "CPT"){

        var lineups = document.getElementById("showdownLineupTable").rows;
        var csv = "data:text/csv;charset=utf-8,";
        var previousLineups = JSON.parse(DKEntries);

        for(let l of lineups){
            if(l.rowIndex == 0) continue;
            var row = [];
            for(let c of l.cells){
                if(c.cellIndex > 5) continue;
                var cell = c.innerHTML;
                var position = "FLEX";
                if(c.cellIndex == 0){
                    position = "CPT";
                }
                var name = cell.split("<br>")[0].replace("CPT ", "").trim();
                row.push(getIdFromUpload(name, position));
            }
            var index = l.rowIndex;
            if(index > previousLineups.length) index = previousLineups.length;
            for(let i = 0; i < row.length; i++){

                previousLineups[index][i+4] = row[i];
            }
        }
        for(let l of previousLineups){
            csv += l.join(",") + "\n";
        }
        //csv += previousLineups.join("\n");
        var encodedUri = encodeURI(csv);

        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "lineups.csv");
        document.body.appendChild(link);
        link.click();
    }else{
        var lineups = document.getElementById("FDShowdownLineupTable").rows;
        var csv = "data:text/csv;charset=utf-8,";
        var previousLineups = JSON.parse(DKEntries);
        
        for(let l of lineups){
            if(l.rowIndex == 0) continue;
            var row = [];
            for(let c of l.cells){
                if(c.cellIndex > 4) continue;
                var cell = c.innerHTML;
                var position = "FD";
                var name = cell.split("<br>")[0].replace("MVP ", "").trim();
                row.push(getIdFromUpload(name, position));
            }
            var index = l.rowIndex;
            if(index > previousLineups.length) index = previousLineups.length;
            for(let i = 0; i < row.length; i++){

                previousLineups[index][i+3] = row[i];
            }
        }
        for(let l of previousLineups){
            csv += l.join(",") + "\n";
        }
        //csv += previousLineups.join("\n");
        var encodedUri = encodeURI(csv);

        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "lineups.csv");
        document.body.appendChild(link);
        link.click();
    }
}

function downloadEditedLineups(){
    var lineups = document.getElementById("lineupTable").rows;
    var csv = "data:text/csv;charset=utf-8,";
    var previousLineups = JSON.parse(DKEntries);

    for(let l of lineups){
        if(l.rowIndex == 0) continue;
        var row = [];
        for(let c of l.cells){
            if(c.cellIndex > 8) continue;
            var cell = c.innerHTML;
            var position = "FLEX";
            if(c.cellIndex == 0){
                position = "QB";l
            }else if(c.cellIndex == 1 || c.cellIndex == 2){
                position = "RB";
            }else if(c.cellIndex == 3 || c.cellIndex == 4 || c.cellIndex == 5){
                position = "WR";
            }else if(c.cellIndex == 6){
                position = "TE";
            }else if(c.cellIndex == 7){
                position = "FLEX";
            }else if(c.cellIndex == 8){
                position = "DST";
            }
            var name = cell.split("<br>")[0].replace("CPT ", "").trim();
            row.push(getIdFromUpload(name, position));
        }

        var index = l.rowIndex;
        if(index > previousLineups.length) index = previousLineups.length;
        for(let i = 0; i < row.length; i++){
            if(row[i].includes("-")) previousLineups[index][i+3] = row[i]; else previousLineups[index][i+4] = row[i];
        }
    }
    for(let l of previousLineups){
        csv += l.join(",") + "\n";
    }
    //csv += previousLineups.join("\n");
    var encodedUri = encodeURI(csv);

    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "lineups.csv");
    document.body.appendChild(link);
    link.click();
}


// Get primary color for team based on abbreviation
function getPrimaryColor(team){
    var primaryColors = {
        "ARI": "#97233F",
        "ATL": "#A71930",
        "BAL": "#241773",
        "BUF": "#00338D",
        "CAR": "#0085CA",
        "CHI": "#0B162A",
        "CIN": "#FB4F14",
        "CLE": "#311D00",
        "DAL": "#041E42",
        "DEN": "#002244",
        "DET": "#0076B6",
        "GB": "#203731",
        "HOU": "#03202F",
        "IND": "#002C5F",
        "JAX": "#006778",
        "KC": "#E31837",
        "LAC": "#002A5E",
        "LAR": "#002244",
        "MIA": "#008E97",
        "MIN": "#4F2683",
        "NE": "#002244",
        "NO": "#D3BC8D",
        "NYG": "#0B2265",
        "NYJ": "#125740",
        "LV": "#A5ACAF",
        "PHI": "#004C54",
        "PIT": "#FFB612",
        "SEA": "#002244",
        "SF": "#AA0000",
        "TB": "#D50A0A",
        "TEN": "#0C2340",
        "WAS": "#773141"
    };
    return primaryColors[team];
}

function getSecondaryColor(team){
    var secondaryColors = {
        "ARI": "#FFFFFF",
        "ATL": "#FFFFFF",
        "BAL": "#FFFFFF",
        "BUF": "#FFFFFF",
        "CAR": "#101820",
        "CHI": "#FFFFFF",
        "CIN": "#000000",
        "CLE": "#FF3C00",
        "DAL": "#869397",
        "DEN": "#FB4F14",
        "DET": "#FFFFFF",
        "GB": "#FFB612",
        "HOU": "#FFFFFF",
        "IND": "#FFFFFF",
        "JAX": "#FFFFFF",
        "KC": "#FFFFFF",
        "LAC": "#FFC20E",
        "LAR": "#FFFFFF",
        "MIA": "#F58220",
        "MIN": "#FFC62F",
        "NE": "#C60C30",
        "NO": "#101820",
        "NYG": "#FFFFFF",
        "NYJ": "#FFFFFF",
        "LV": "#000000",
        "PHI": "#A5ACAF",
        "PIT": "#101820",
        "SEA": "#69BE28",
        "SF": "#FFFFFF",
        "TB": "#FFFFFF",
        "TEN": "#FFFFFF",
        "WAS": "#FFB612"
    };
    return secondaryColors[team];
}

// Color table rows based on team
function colorTableRows(){  
    var t = document.getElementById("contestDataTable");
    var othert = document.getElementById("cashOrGppTable");
    var allTables = [t, othert];
    //var allTables = document.getElementsByTagName("table"); // This works, but is disorienting on some tables
    for(let t of allTables){
        // find header "Team"
        var ths = t.getElementsByTagName("th");
        var teamIndex = 0;
        for(let th of ths){
            if(th.innerHTML == "Team"){
                teamIndex = th.cellIndex;
            }
        }

        var rows = t.rows;
        for(let r of rows){
            if(r.rowIndex == 0) continue;
            var team = r.cells[teamIndex].innerHTML.trim();
            r.style.backgroundColor = getPrimaryColor(team);
            r.style.color = getSecondaryColor(team);
        }
    }
}

// Set defense projections based on defensesTable data; setting K data by this as well
function setDefenseProjections(){
    var defensesTable = document.getElementById("defensesTable");
    var rows = defensesTable.rows;
    var defenses = {};
    for(let r of rows){
        if(r.rowIndex == 0) continue;
        var team = r.cells[1].innerHTML.trim();
        var sacks = r.cells[2].innerHTML.trim();
        var interceptions = r.cells[3].innerHTML.trim();
        var fumbles = r.cells[4].innerHTML.trim();
        var touchdowns = r.cells[5].innerHTML.trim();
        var pointsAllowed = r.cells[6].innerHTML.trim();
        var oppOffense = getOffenseProwess(team, "opponent");
        var proj = ((Number(sacks) + Number(interceptions) + Number(fumbles) + Number(touchdowns) * .6 + Number(pointsAllowed) * -.5 + 13 - oppOffense)/2).toFixed(1);

        defenses[team] = proj;
    }
    
    var players = document.getElementById("contestDataTable").rows;
    for(let p of players){
        if(p.cells[2].innerHTML == "D" || p.cells[2].innerHTML == "DST" || p.cells[2].getAttribute("defense") == "true"){
            p.cells[9].innerHTML = defenses[p.cells[3].innerHTML.trim()];
            if(p.cells[2].innerHTML == "CPT") p.cells[9].innerHTML =( Number(p.cells[9].innerHTML) * 1.5).toFixed(1);
        }
        if(p.cells[2].innerHTML == "K" || p.cells[2].getAttribute("kicker") == "kicker"){
            var kickers = getInfoFromJSON('kickers.json');
            if(kickers[p.cells[1].innerHTML.trim()] == undefined) continue; else p.cells[9].innerHTML = kickers[p.cells[1].innerHTML.trim()]["FPS"];

            //p.cells[9].innerHTML = ((Number(defenses[p.cells[3].innerHTML.trim()]) - Number(defenses[p.cells[4].innerHTML.trim()]))/5+5.5+getOffenseProwess(p.cells[3].innerHTML.trim(), "team")).toFixed(1);
            if(p.cells[2].innerHTML == "CPT") p.cells[9].innerHTML = (Number(p.cells[9].innerHTML) * 1.5).toFixed(1);
        }
    }
}

// Get offense prowess based on team and opponent
function getOffenseProwess(team, whichTeam){
    var col = 0;
    if(whichTeam == "opponent"){
        col = 4;
    } else col = 3;
    var table = document.getElementById("contestDataTable");
    var rows = table.rows;
    var bestplayers = [0,0,0]; // get 3 best players on team based on projections
    for(let r of rows){
        if(r.rowIndex == 0 || r.cells[2].innerHTML.trim() == "CPT") continue;
        if(r.cells[col].innerHTML.trim() == team){
            let proj = Number(r.cells[9].innerHTML.trim());
            if(proj > bestplayers[0]){
                bestplayers[2] = bestplayers[1];
                bestplayers[1] = bestplayers[0];
                bestplayers[0] = proj;
            } else if(proj > bestplayers[1]){
                bestplayers[2] = bestplayers[1];
                bestplayers[1] = proj;
            } else if(proj > bestplayers[2]){
                bestplayers[2] = proj;
            }
        }
    }
    return (bestplayers[0] + bestplayers[1] + bestplayers[2]-36)/3;
}

// Adjust projections based on opponent defense
function adjustProjectionsByDefense(){
    var defenses = document.getElementById("defensesTable").rows;
    var players = document.getElementById("contestDataTable").rows;
    var defenseEffect = {};
    for(let d of defenses){
        let defense = d.cells[1].innerHTML.trim();
        
        let pointsAllowed = d.cells[6].innerHTML.trim();
        let yardsAllowed = d.cells[7].innerHTML.trim();

        defenseEffect[defense] = {'pointsAllowed': pointsAllowed, 'yardsAllowed': yardsAllowed};
    }
    for(let p of players){
        let defense = p.cells[4].innerHTML.trim();
        let proj = p.cells[9].getAttribute("projections");
        if(proj == null || proj == undefined || proj == "") continue;
        proj = JSON.parse(proj);
        let pointsAllowed = defenseEffect[defense].pointsAllowed;
        let yardsAllowed = defenseEffect[defense].yardsAllowed;
        let newProj = {};
        newProj["Passing Yards"] = (proj["Passing Yards"] * (1 + Number(yardsAllowed)*.07)).toFixed(1);
        newProj["Passing TDs"] = (proj["Passing TDs"] * (1 + Number(pointsAllowed)*.07)).toFixed(1);
        newProj["Interceptions"] = (proj["Interceptions"] * (1 - Number(pointsAllowed)*.07)).toFixed(1);
        newProj["Rushing Yards"] = (proj["Rushing Yards"] * (1 + Number(yardsAllowed)*.07)).toFixed(1);
        newProj["Rushing TDs"] = (proj["Rushing TDs"] * (1 + Number(pointsAllowed)*.07)).toFixed(1);
        newProj["Receptions"] = (proj["Receptions"] * (1 + Number(pointsAllowed)*.07)).toFixed(1);
        newProj["Receiving Yards"] = (proj["Receiving Yards"] * (1 +Number(yardsAllowed)*.07)).toFixed(1);
        newProj["Receiving TDs"] = (proj["Receiving TDs"] * (1 + Number(pointsAllowed)*.07)).toFixed(1);

        p.cells[9].innerHTML = ((newProj["Passing Yards"] * 0.04) + (newProj["Passing TDs"] * 4) + (newProj["Interceptions"] * -1) + (newProj["Rushing Yards"] * 0.1) + (newProj["Rushing TDs"] * 6) + (newProj["Receptions"] * 1) + (newProj["Receiving Yards"] * 0.1) + (newProj["Receiving TDs"] * 6)).toFixed(1);
        p.cells[9].setAttribute("projections", JSON.stringify(newProj));
    }
}

// Add a row to injury table to allocate injury designation and beneficiaries
function addInjured(){
    var table = document.getElementById("injuryTable");
    var row = table.insertRow(-1);
    var cell = row.insertCell(-1);
    cell.innerHTML = '<input list="playersList" class="injuryName injury" onchange="updateInjuryTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<input list="playersList" class="injuryB1 injury" onchange="updateInjuryTable()"><input type="number" class="injuryB1Pct injury" onchange="updateInjuryTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<input list="playersList" class="injuryB2 injury" onchange="updateInjuryTable()"><input type="number" class="injuryB2Pct injury" onchange="updateInjuryTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<input list="playersList" class="injuryB3 injury" onchange="updateInjuryTable()"><input type="number" class="injuryB3Pct injury" onchange="updateInjuryTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<input list="playersList" class="injuryB4 injury" onchange="updateInjuryTable()"><input type="number" class="injuryB4Pct injury" onchange="updateInjuryTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<input list="playersList" class="injuryB5 injury" onchange="updateInjuryTable()"><input type="number" class="injuryB5Pct injury" onchange="updateInjuryTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<button onclick="removeRow(this)">Remove</button>';


}

// Update injury table based on input
function updateInjuryTable(){
    var table = document.getElementById("injuryTable");
    var rows = table.rows;
    var injuries = [];
    for(let r of rows){
        if(r.rowIndex == 0) continue;
        var injury = {};
        injury.name = r.cells[0].children[0].value;
        injury.b1 = r.cells[1].children[0].value;
        injury.b1Pct = r.cells[1].children[1].value;
        injury.b2 = r.cells[2].children[0].value;
        injury.b2Pct = r.cells[2].children[1].value;
        injury.b3 = r.cells[3].children[0].value;
        injury.b3Pct = r.cells[3].children[1].value;
        injury.b4 = r.cells[4].children[0].value;
        injury.b4Pct = r.cells[4].children[1].value;
        injury.b5 = r.cells[5].children[0].value;
        injury.b5Pct = r.cells[5].children[1].value;
        injuries.push(injury);
    }
    localStorage.injuries = JSON.stringify(injuries);
}

// Get injury table from storage
function getInjuryTable(){
    var table = document.getElementById("injuryTable");
    if(localStorage.injuries == undefined) return;
    var injuries = JSON.parse(localStorage.injuries);
    for(let i of injuries){
        var row = table.insertRow(-1);
        var cell = row.insertCell(-1);
        cell.innerHTML = '<input list="playersList" class="injuryName injury" onchange="updateInjuryTable()" value="'+i.name+'">';
        cell = row.insertCell(-1);
        cell.innerHTML = '<input list="playersList" class="injuryB1 injury" onchange="updateInjuryTable()" value="'+i.b1+'"><input type="number" class="injuryB1Pct injury" onchange="updateInjuryTable()" value="'+i.b1Pct+'">';
        cell = row.insertCell(-1);
        cell.innerHTML = '<input list="playersList" class="injuryB2 injury" onchange="updateInjuryTable()" value="'+i.b2+'"><input type="number" class="injuryB2Pct injury" onchange="updateInjuryTable()" value="'+i.b2Pct+'">';
        cell = row.insertCell(-1);
        cell.innerHTML = '<input list="playersList" class="injuryB3 injury" onchange="updateInjuryTable()" value="'+i.b3+'"><input type="number" class="injuryB3Pct injury" onchange="updateInjuryTable()" value="'+i.b3Pct+'">';
        cell = row.insertCell(-1);
        cell.innerHTML = '<input list="playersList" class="injuryB4 injury" onchange="updateInjuryTable()" value="'+i.b4+'"><input type="number" class="injuryB4Pct injury" onchange="updateInjuryTable()" value="'+i.b4Pct+'">';
        cell = row.insertCell(-1);
        cell.innerHTML = '<input list="playersList" class="injuryB5 injury" onchange="updateInjuryTable()" value="'+i.b5+'"><input type="number" class="injuryB5Pct injury" onchange="updateInjuryTable()" value="'+i.b5Pct+'">';
        cell = row.insertCell(-1);
        cell.innerHTML = '<button onclick="removeRow(this)">Remove</button>';
    }
}

// Update projections based on injuries
function adjustProjectionsByInjuries(){
    var players = document.getElementById("contestDataTable").rows;
    if(localStorage.injuries == undefined) return;
    var injuries = JSON.parse(localStorage.injuries);

    for(let i of injuries){
        var found = 0;
        var x = 0;
        while(x < players.length){
            if(players[x].cells[1].innerHTML.trim() == i.name.trim()){
                if(players[x].cells[2].innerHTML.trim() == "CPT") {
                    players[x].cells[9].innerHTML = 0;
                    x++;
                } else{
                    found = x;
                    var playerProjections = players[found].cells[9].innerHTML;
                    players[found].cells[9].innerHTML = 0;
                    x++;
                }
            }else{
                x++;
            }
        }
        for(p of players){
            if(found==0) continue; else{
                if(p.rowIndex == 0 || p.rowIndex==found) continue;
                if(p.tagName != "TR") continue;
                if(p.cells[1].innerHTML.trim() == i.b1.trim()){
                    p.cells[9].innerHTML = Number(p.cells[9].innerHTML) + Number(i.b1Pct)*Number(playerProjections)/100;
                    }
                if(p.cells[1].innerHTML.trim() == i.b2.trim()){
                    p.cells[9].innerHTML = Number(p.cells[9].innerHTML) + Number(i.b2Pct)*Number(playerProjections)/100;
                }
                if(p.cells[1].innerHTML.trim() == i.b3.trim()){
                    p.cells[9].innerHTML= Number(p.cells[9].innerHTML) + Number(i.b3Pct)*Number(playerProjections)/100;
                }
                if(p.cells[1].innerHTML.trim() == i.b4.trim()){
                    p.cells[9].innerHTML = Number(p.cells[9].innerHTML) + Number(i.b4Pct)*Number(playerProjections)/100;
                }
                if(p.cells[1].innerHTML.trim() == i.b5.trim()){
                    p.cells[9].innerHTML = Number(p.cells[9].innerHTML) +Number(i.b5Pct)*Number(playerProjections)/100;

                }
            }
        }
     }
}

// Add injury benefit to player projections
function addInjuryBenefit(playerProjections, bProjections, bPct){
    if(bProjections == undefined || bProjections == null || bProjections == ""){
        newProj = {
            "Passing Yards": (Number(playerProjections["Passing Yards"]) * Number(bPct)/100).toFixed(1),
            "Passing TDs": (Number(playerProjections["Passing TDs"]) * Number(bPct)/100).toFixed(1),
            "Interceptions": (Number(playerProjections["Interceptions"]) * Number(bPct)/100).toFixed(1),
            "Rushing Yards": (Number(playerProjections["Rushing Yards"]) * Number(bPct)/100).toFixed(1),
            "Rushing TDs": (Number(playerProjections["Rushing TDs"]) * Number(bPct)/100).toFixed(1),
            "Receptions": (Number(playerProjections["Receptions"]) * Number(bPct)/100).toFixed(1),
            "Receiving Yards": (Number(playerProjections["Receiving Yards"]) * Number(bPct)/100).toFixed(1),
            "Receiving TDs": (Number(playerProjections["Receiving TDs"]) * Number(bPct)/100).toFixed(1)
        };
        return newProj;
        }

    var newProj = {};
    newProj["Passing Yards"] = (Number(bProjections["Passing Yards"]) + Number(playerProjections["Passing Yards"]) * Number(bPct)/100).toFixed(1);
    newProj["Passing TDs"] = (Number(bProjections["Passing TDs"]) + Number(playerProjections["Passing TDs"]) * Number(bPct)/100).toFixed(1);
    newProj["Interceptions"] = (Number(bProjections["Interceptions"]) + Number(playerProjections["Interceptions"]) * Number(bPct)/100).toFixed(1);
    newProj["Rushing Yards"] = (Number(bProjections["Rushing Yards"]) + Number(playerProjections["Rushing Yards"]) * Number(bPct)/100).toFixed(1);
    newProj["Rushing TDs"] = (Number(bProjections["Rushing TDs"]) + Number(playerProjections["Rushing TDs"]) * Number(bPct)/100).toFixed(1);
    newProj["Receptions"] = (Number(bProjections["Receptions"]) + Number(playerProjections["Receptions"]) * Number(bPct)/100).toFixed(1);
    newProj["Receiving Yards"] = (Number(bProjections["Receiving Yards"]) + Number(playerProjections["Receiving Yards"]) * Number(bPct)/100).toFixed(1);
    newProj["Receiving TDs"] = (Number(bProjections["Receiving TDs"]) + Number(playerProjections["Receiving TDs"]) * Number(bPct)/100).toFixed(1);
    return newProj;
}


// Reload page so that injury updates can take effect
function reloadPage(){
    
    location.reload();
}

// Clear injuries table
function clearInjuries(){
    localStorage.injuries = JSON.stringify([]);
    location.reload();
}

function clearOldData(){
    var table = document.getElementById("contestDataTable");
    var rows = table.rows;
    var now = new Date();
    var y = now.getFullYear();
    var m = Number(now.getMonth())+1;
    var d = Number(now.getDate())+1;
    var date = y+"-"+m+"-"+d;
    for(let i=0; i<rows.length; i++){
        let time = new Date(rows[i].cells[8].innerHTML.split(" ")[1]);
        if(time < date){
            table.deleteRow(i);
            i--;
        }
    }
}

// multiply projection for captains by 1.5
async function captainize(){
    let promise = new Promise(function(resolve) {
    var table = document.getElementById("contestDataTable");
    var rows = table.rows;
    for(let r of rows){
        if(r.cells[2].innerHTML == "CPT"){
            r.cells[9].innerHTML = (r.cells[9].innerHTML * 1.5).toFixed(1);
        }
    }
    resolve();
    });
    
    promise.then(() => {sortTable("contestDataTable", 9)}).then(() => {populateTeamInfo()});

}

//// !----- ~~~~ Modifying injury information to the opposite effect for steal mode ~~~~ -----! ////

// Add a row to steal table to allocate steal designation and beneficiaries
function addSteal(){
    var table = document.getElementById("stealTable");
    var row = table.insertRow(-1);
    var cell = row.insertCell(-1);
    cell.innerHTML = '<input list="playersList" class="stealName steal" onchange="updatestealTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<input list="playersList" class="stealB1 steal" onchange="updatestealTable()"><input type="number" class="stealB1Pct steal" onchange="updatestealTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<input list="playersList" class="stealB2 steal" onchange="updatestealTable()"><input type="number" class="stealB2Pct steal" onchange="updatestealTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<input list="playersList" class="stealB3 steal" onchange="updatestealTable()"><input type="number" class="stealB3Pct steal" onchange="updatestealTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<input list="playersList" class="stealB4 steal" onchange="updatestealTable()"><input type="number" class="stealB4Pct steal" onchange="updatestealTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<input list="playersList" class="stealB5 steal" onchange="updatestealTable()"><input type="number" class="stealB5Pct steal" onchange="updatestealTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<button onclick="removeRow(this)">Remove</button>';

    var players = document.getElementById("contestDataTable").rows;
    var names = [];
    for(let p of players){
        if(p.rowIndex == 0) continue;
        names.push(p.cells[1].innerHTML.trim());
    }
    
}

// Remove button for steal table and injury table deletes row
function removeRow(button){
    var row = button.parentNode.parentNode;
    row.parentNode.removeChild(row);
    updateInjuryTable();
    updatestealTable();
}

// Update steal table based on input
function updatestealTable(){
    var table = document.getElementById("stealTable");
    var rows = table.rows;
    var stolen = [];
    for(let r of rows){
        if(r.rowIndex == 0) continue;
        var steal = {};
        steal.name = r.cells[0].children[0].value;
        steal.b1 = r.cells[1].children[0].value;
        steal.b1Pct = r.cells[1].children[1].value;
        steal.b2 = r.cells[2].children[0].value;
        steal.b2Pct = r.cells[2].children[1].value;
        steal.b3 = r.cells[3].children[0].value;
        steal.b3Pct = r.cells[3].children[1].value;
        steal.b4 = r.cells[4].children[0].value;
        steal.b4Pct = r.cells[4].children[1].value;
        steal.b5 = r.cells[5].children[0].value;
        steal.b5Pct = r.cells[5].children[1].value;
        stolen.push(steal);
    }
    localStorage.stolen = JSON.stringify(stolen);
}

// Get steal table from storage
function getStealTable(){
    var table = document.getElementById("stealTable");
    if(localStorage.stolen == undefined) return;
    var stolen = JSON.parse(localStorage.stolen);
    for(let i of stolen){
        var row = table.insertRow(-1);
        var cell = row.insertCell(-1);
        cell.innerHTML = '<input list="playersList" class="stealName steal" onchange="updatestealTable()" value="'+i.name+'">';
        cell = row.insertCell(-1);
        cell.innerHTML = '<input list="playersList" class="stealB1 steal" onchange="updatestealTable()" value="'+i.b1+'"><input type="number" class="stealB1Pct steal" onchange="updatestealTable()" value="'+i.b1Pct+'">';
        cell = row.insertCell(-1);
        cell.innerHTML = '<input list="playersList" class="stealB2 steal" onchange="updatestealTable()" value="'+i.b2+'"><input type="number" class="stealB2Pct steal" onchange="updatestealTable()" value="'+i.b2Pct+'">';
        cell = row.insertCell(-1);
        cell.innerHTML = '<input list="playersList" class="stealB3 steal" onchange="updatestealTable()" value="'+i.b3+'"><input type="number" class="stealB3Pct steal" onchange="updatestealTable()" value="'+i.b3Pct+'">';
        cell = row.insertCell(-1);
        cell.innerHTML = '<input list="playersList" class="stealB4 steal" onchange="updatestealTable()" value="'+i.b4+'"><input type="number" class="stealB4Pct steal" onchange="updatestealTable()" value="'+i.b4Pct+'">';
        cell = row.insertCell(-1);
        cell.innerHTML = '<input list="playersList" class="stealB5 steal" onchange="updatestealTable()" value="'+i.b5+'"><input type="number" class="stealB5Pct steal" onchange="updatestealTable()" value="'+i.b5Pct+'">';
        cell = row.insertCell(-1);
        cell.innerHTML = '<button onclick="removeRow(this)">Remove</button>';
    }
}

// Update projections based on injuries
function adjustProjectionsByStolen(){
    var players = document.getElementById("contestDataTable").rows;
    if(localStorage.stolen == undefined) return;
    var stolen = JSON.parse(localStorage.stolen);

    for(let i of stolen){
        var found = 0;
        var x = 0;
        while(x < players.length && found == 0){
            if(players[x].cells[1].innerHTML.trim() == i.name.trim()){
                found = x;
                var playerProjections = players[found].cells[9].innerHTML;
                players[found].cells[9].innerHTML = 0;
            }else{
                x++;
            }
        }
        if(found.length==0) continue;
        for(p of players){
            // continue if p is not a row
            if(p.rowIndex == 0) continue;
            // continue if p is not a tr element
            if(p.tagName != "TR") continue;
            if(found==0) continue; else{
                var p = players[r];
                if(p.rowIndex == 0 || p.rowIndex==found) continue;
                if(p.tagName != "TR") continue;
                if(p.cells[1].innerHTML.trim() == i.b1.trim()){
                    p.cells[9].innerHTML = Number(p.cells[9].innerHTML) + Number(i.b1Pct)*Number(playerProjections)/100;
                }
                if(p.cells[1].innerHTML.trim() == i.b2.trim()){
                    p.cells[9].innerHTML = Number(p.cells[9].innerHTML) + Number(i.b2Pct)*Number(playerProjections)/100;
                }           
                if(p.cells[1].innerHTML.trim() == i.b3.trim()){
                    p.cells[9].innerHTML= Number(p.cells[9].innerHTML) + Number(i.b3Pct)*Number(playerProjections)/100;
                }
                if(p.cells[1].innerHTML.trim() == i.b4.trim()){
                    p.cells[9].innerHTML = Number(p.cells[9].innerHTML) + Number(i.b4Pct)*Number(playerProjections)/100;
                }
                if(p.cells[1].innerHTML.trim() == i.b5.trim()){
                    p.cells[9].innerHTML = Number(p.cells[9].innerHTML) +Number(i.b5Pct)*Number(playerProjections)/100;
    
                }
            }

        }
    }
}

// Add steal benefit to player projections
function addstealBenefit(bProjections, bPct){
    var newProj = {};
    newProj["Passing Yards"] = (Number(bProjections["Passing Yards"]) - Number(bProjections["Passing Yards"]) * Number(bPct)/100).toFixed(1);
    newProj["Passing TDs"] = (Number(bProjections["Passing TDs"]) - Number(bProjections["Passing TDs"]) * Number(bPct)/100).toFixed(1);
    newProj["Interceptions"] = (Number(bProjections["Interceptions"]) - Number(bProjections["Interceptions"]) * Number(bPct)/100).toFixed(1);
    newProj["Rushing Yards"] = (Number(bProjections["Rushing Yards"]) - Number(bProjections["Rushing Yards"]) * Number(bPct)/100).toFixed(1);
    newProj["Rushing TDs"] = (Number(bProjections["Rushing TDs"]) - Number(bProjections["Rushing TDs"]) * Number(bPct)/100).toFixed(1);
    newProj["Receptions"] = (Number(bProjections["Receptions"]) - Number(bProjections["Receptions"]) * Number(bPct)/100).toFixed(1);
    newProj["Receiving Yards"] = (Number(bProjections["Receiving Yards"]) - Number(bProjections["Receiving Yards"]) * Number(bPct)/100).toFixed(1);
    newProj["Receiving TDs"] = (Number(bProjections["Receiving TDs"]) - Number(bProjections["Receiving TDs"]) * Number(bPct)/100).toFixed(1);
    return newProj;
}


// Take the difference between bprojections and newproj to add to playerprojections
function updateFromSteal(playerProjections, oldProj, newProj){
    if(playerProjections == null) playerProjections = {};
    for(let p in oldProj){
        if(playerProjections[p] == null || playerProjections[p] == undefined) playerProjections[p] = 0;
        playerProjections[p] = (Number(playerProjections[p]) + Number(oldProj[p]) - Number(newProj[p])).toFixed(1);
    }
    return playerProjections;
}

// Clear injuries table
function clearSteal(){
    localStorage.stolen = JSON.stringify([]);
    
    location.reload();
}

// Fill cash or GPP table with players and buttons to assign them to cash or GPP
function fillCashOrGpp(){
    var cogTable = document.getElementById("cashOrGppTable");
    var players = document.getElementById("contestDataTable").rows;
    var names = [];
    var positions = [];
    var teams = [];
    var opponents = [];
    var salaries = [];
    var projections = [];
    var values = [];
    for(let p of players){
        if(p.rowIndex == 0 || names.includes(p.cells[1].innerHTML.trim()) || p.cells[2].innerHTML == "CPT") continue;
        names.push(p.cells[1].innerHTML.trim());
        positions.push(p.cells[2].innerHTML.trim());
        teams.push(p.cells[3].innerHTML.trim());
        opponents.push(p.cells[4].innerHTML.trim());
        salaries.push(p.cells[5].innerHTML.trim());
        projections.push(p.cells[9].innerHTML.trim());
        values.push((Number(p.cells[9].innerHTML.trim())/Number(p.cells[5].innerHTML.trim())*1000).toFixed(1));
    }
    var cashPlays = [];
    if(localStorage.cashPlays) cashPlays = JSON.parse(localStorage.cashPlays);
    var gppPlays = [];
    if(localStorage.gppPlays) gppPlays = JSON.parse(localStorage.gppPlays);
    for(let n of names){
        var row = cogTable.insertRow(-1);
        var cell = row.insertCell(-1);
        cell.innerHTML = n;
        cell = row.insertCell(-1);
        cell.innerHTML = positions[names.indexOf(n)];
        cell = row.insertCell(-1);
        cell.innerHTML = teams[names.indexOf(n)];
        cell = row.insertCell(-1);
        cell.innerHTML = opponents[names.indexOf(n)];
        cell = row.insertCell(-1);
        cell.innerHTML = projections[names.indexOf(n)];
        cell = row.insertCell(-1);
        cell.innerHTML = salaries[names.indexOf(n)];
        cell = row.insertCell(-1);
        cell.innerHTML = values[names.indexOf(n)];
        cell = row.insertCell(-1);
        if(cashPlays.includes(n)){
            cell.innerHTML = '<button onclick="toggleCash(this)" class="cashOrGppButton" selected="true">Cash</button>';
        }else{
            cell.innerHTML = '<button onclick="toggleCash(this)" class="cashOrGppButton" selected="false">Cash</button>';
        }
        cell.style.backgroundColor = "white";
        cell = row.insertCell(-1);
        if(gppPlays.includes(n)){
            cell.innerHTML = '<button onclick="toggleGpp(this)" class="cashOrGppButton" selected="true">GPP</button>';
        }else{
            cell.innerHTML = '<button onclick="toggleGpp(this)" class="cashOrGppButton" selected="false">GPP</button>';
        }
        cell.style.backgroundColor = "white";
    }

}

// Toggle cash designation for player
function toggleCash(btn){
    var numCash = document.getElementById("numCashInTable");
    var player = btn.parentNode.parentNode.cells[0].innerHTML;
    var cashPlays = [];
    if(localStorage.cashPlays) cashPlays = JSON.parse(localStorage.cashPlays);
    if(btn.getAttribute("selected") == "true"){
        btn.setAttribute("selected", "false");
        btn.innerHTML = "Cash";
        cashPlays.splice(cashPlays.indexOf(player), 1);
        numCash.innerHTML = Number(numCash.innerHTML) - 1;
    } else{
        btn.setAttribute("selected", "true");
        btn.innerHTML = "Cash";
        cashPlays.push(player);
        numCash.innerHTML = Number(numCash.innerHTML) + 1;
    }
    localStorage.cashPlays = JSON.stringify(cashPlays);
}

// Toggle GPP designation for player
function toggleGpp(btn){
    var numGpp = document.getElementById("numGppInTable");
    var player = btn.parentNode.parentNode.cells[0].innerHTML;
    var gppPlays = [];
    if(localStorage.gppPlays) gppPlays = JSON.parse(localStorage.gppPlays);
    if(btn.getAttribute("selected") == "true"){
        btn.setAttribute("selected", "false");
        btn.innerHTML = "GPP";
        gppPlays.splice(gppPlays.indexOf(player), 1);
        numGpp.innerHTML = Number(numGpp.innerHTML) - 1;
    } else{
        btn.setAttribute("selected", "true");
        btn.innerHTML = "GPP";
        gppPlays.push(player);
        numGpp.innerHTML = Number(numGpp.innerHTML) + 1;
    }
    localStorage.gppPlays = JSON.stringify(gppPlays);
}

function clearCashOrGpp(){
    localStorage.cashPlays = JSON.stringify([]);
    localStorage.gppPlays = JSON.stringify([]);
    
    location.reload();
}

// Fill select with teams
function fillCashOrGppTeam(){
    var select = document.getElementById('cashOrGppTeam');
    var teams = [];
    var players = document.getElementById("contestDataTable").rows;
    for(let p of players){
        if(p.rowIndex == 0 || teams.includes(p.cells[3].innerHTML.trim())) continue;
        teams.push(p.cells[3].innerHTML.trim());
    }
    for(let t of teams){
        var option = document.createElement("option");
        option.text = t;
        select.add(option);
    }
}

// Filter cashOrGpp table by selections
async function filterCashOrGpp(){
    let promise = new Promise(function(resolve) {
        var contestSelect = document.getElementById('contestSelectCashOrGpp').value;
        var contestTable = document.getElementById("contestDataTable");
        var contestRows = contestTable.rows;
        var inContest = [];
        for(let r of contestRows){
            if(r.rowIndex == 0) continue;
            if(r.cells[8].innerHTML == contestSelect){
                inContest.push(r.cells[1].innerHTML);
            }
        }
        resolve([inContest, contestSelect]);
    });
    promise.then((data) =>{
        var inContest = data[0];
        var contestSelect = data[1];
        var teamSelect = document.getElementById('cashOrGppTeam').value;
        var posSelect= document.getElementById('cashOrGppPosition').value;
        var table = document.getElementById("cashOrGppTable");
        var rows = table.rows;
        var numCash = 0;
        var numGpp = 0;
        for(let r of rows){
            if(r.rowIndex == 0) continue;
            if(teamSelect != "All" && r.cells[2].innerHTML != teamSelect){
                r.style.display = "none";
            }else if(posSelect != "All" && r.cells[1].innerHTML != posSelect){
                r.style.display = "none";
            }else if(contestSelect != "All slates" && !inContest.includes(r.cells[0].innerHTML)){
                r.style.display = "none";
            }else{
                r.style.display = "";
            }
            if(r.cells[7].getElementsByTagName('button')[0].getAttribute("selected") == "true" && r.style.display != "none"){
                numCash++;
            }
            if(r.cells[8].getElementsByTagName('button')[0].getAttribute("selected") == "true" && r.style.display != "none"){
                numGpp++;
            }
        }
        document.getElementById("numCashInTable").innerHTML = numCash;
        document.getElementById("numGppInTable").innerHTML = numGpp;
    });
}

// Fill matchups table with Team / Slider / Opponent so we can weight projections based on alternate matchup expectations
function fillMatchupsTable(){
    var matchupsTable = document.getElementById("matchupsTable");
    var players = document.getElementById("contestDataTable").rows;
    var teams = [];
    var opponents = [];
    for(let p of players){
        if(p.rowIndex == 0 || teams.includes(p.cells[3].innerHTML.trim())) continue;
        teams.push(p.cells[3].innerHTML.trim());
        opponents.push(p.cells[4].innerHTML.trim());
    }

    for(let i = 0; i < teams.length; i++){
        var row = matchupsTable.insertRow(-1);
        var cell = row.insertCell(-1);
        cell.innerHTML = teams[i];
        cell = row.insertCell(-1);
        cell.innerHTML = '<text style="width:100px">0</text><input type="range" style="width:300px" min="-100" max="100" value="0" step="5" class="matchupSlider" oninput="updateProjectionsByMatchup(this)"><text style="width:100px">0</text>';
        cell.style.width = "500px";
        cell = row.insertCell(-1);
        cell.innerHTML = opponents[i];
    }

    if(localStorage.matchupsTableData){
        var data = JSON.parse(localStorage.matchupsTableData);
        for(let r of matchupsTable.rows){
            if(r.rowIndex == 0) continue;
            if(data[r.cells[0].innerHTML] == undefined) continue;
            r.cells[1].children[1].value = data[r.cells[0].innerHTML]["slider"];
            r.cells[1].children[0].innerHTML = data[r.cells[0].innerHTML]["slider"];
            r.cells[1].children[2].innerHTML = -data[r.cells[0].innerHTML]["slider"];
            r.cells[2].innerHTML = data[r.cells[0].innerHTML]["opponent"];
        }
    }
}

// Update projections by matchup
function updateProjectionsByMatchup(slider){
    var matchupsTable = document.getElementById("matchupsTable");

    var data = {};
    for(let r of matchupsTable.rows){
        if(r.rowIndex == 0) continue;
        data[r.cells[0].innerHTML] = {"slider":r.cells[1].children[1].value, "opponent":r.cells[2].innerHTML};
    }
    localStorage.matchupsTableData = JSON.stringify(data);

    var leftText = slider.previousElementSibling;
    var rightText = slider.nextElementSibling;
    leftText.innerHTML = slider.value;
    rightText.innerHTML = -slider.value;
}

// Apply matchup adjustments to projections
async function applyMatchupAdjustments(){
    let promise = new Promise(function(resolve) {
        if(localStorage.matchupsTableData == undefined) resolve();
        var data = JSON.parse(localStorage.matchupsTableData);
        var players = document.getElementById("contestDataTable").rows;
        for(let p of players){
            if(p.rowIndex == 0) continue;
            if(p.cells[2].getAttribute("defense") == "true"){
                if(!p.cells[4].innerHTML in data) continue; else{
                    p.cells[9].innerHTML = (p.cells[9].innerHTML * (100-Number(data[p.cells[4].innerHTML]["slider"]))/100).toFixed(1);
                }
            }else{

                if(!p.cells[3].innerHTML in data) continue; else{
                    p.cells[9].innerHTML = (p.cells[9].innerHTML * (100+Number(data[p.cells[3].innerHTML]["slider"]))/100).toFixed(1);
                }
            }
        }
        resolve();
    });
    promise.then(
        () => {
            addOwnershipProjectionsShowdown();
        }
    )
    
}

// Reset matchups to default values
function clearMatchups(){
    localStorage.matchupsTableData = JSON.stringify({});
    
    location.reload();
}

// Add a div to the Other Groups section to allow for grouping of players
// Within the div, be able to add and remove players from the group
function addGroup(){
    var newGroup = document.createElement("div");
    newGroup.setAttribute("class", "playerGroup");
    var groupID = document.getElementById("allGroups").children.length;
    newGroup.setAttribute("id", "group"+groupID);
    newGroup.innerHTML = "<button onclick='addGroupPlayer("+groupID+")'>Add Player</button><table id='group"+groupID+"Table'></table>";
    document.getElementById("allGroups").appendChild(newGroup);
}

// Add a player to a group
function addGroupPlayer(id){
    var table = document.getElementById("group"+id+"Table");
    var row = table.insertRow(-1);
    var cell = row.insertCell(-1);
    cell.innerHTML = '<input list="playersList" class="groupPlayer" onchange="updateGroupTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<button onclick="removeRow(this)">Remove</button>';
}

function updateGroupTable(){
    var groups = document.getElementsByClassName("playerGroup");
    var groupData = [];
    for(let g of groups){
        var group = {};
        group.players = [];
        var players = g.getElementsByClassName("groupPlayer");
        for(let p of players){
            group.players.push(p.value);
        }
        groupData.push(group);
    }
    localStorage.groups = JSON.stringify(groupData);

}

// Clear groups
function clearGroups(){
    localStorage.groups = JSON.stringify([]);
    
    location.reload();
}

// Get groups from storage
function getGroupsFromStorage(){
    var groups = JSON.parse(localStorage.groups);
    for(let g of groups){
        var newGroup = document.createElement("div");
        newGroup.setAttribute("class", "playerGroup");
        var groupID = document.getElementById("allGroups").children.length;
        newGroup.setAttribute("id", "group"+groupID);
        newGroup.innerHTML = "<button onclick='addGroupPlayer("+groupID+")'>Add Player</button><table id='group"+groupID+"Table'></table>";
        document.getElementById("allGroups").appendChild(newGroup);
        var table = document.getElementById("group"+groupID+"Table");
        for(let p of g.players){
            var row = table.insertRow(-1);
            var cell = row.insertCell(-1);
            cell.innerHTML = '<input list="playersList" class="groupPlayer" onchange="updateGroupTable()" value="'+p+'">';
            cell = row.insertCell(-1);
            cell.innerHTML = '<button onclick="removeRow(this)">Remove</button>';
        }
    }
}