// Scrape contest data from Draftkings.com for upcoming NFL contests
var corsAPI = "https://cors-anywhere.herokuapp.com/";
var url = "https://www.draftkings.com/lobby/getcontests?sport=NFL";
var select = document.getElementById('select');
var table = document.getElementById("contestDataTable");
console.log("If requests fail, may need to go to https://cors-anywhere.herokuapp.com/corsdemo to re-authorize");
async function getContestData(){
    var contestData = [];
    // Get an array of Contests from data that we can iterate thru to get contest start times
        
        let myPromise = new Promise(function(resolve, reject) {
            console.log("new pull");
            let req = new XMLHttpRequest();
            req.open('GET', corsAPI+url);
            req.onload = function() {
                if (req.status == 200) {
                    resolve(req.response);
                }
                else {
                    reject(Error(req.statusText));
                }
            };
            req.send();
        });
        data = await myPromise;
        contestData = JSON.parse(data).Contests; 
        addSelectOption(contestData);
        getPlayerData(contestData);
}

function addSelectOption(contestData){
    // Add a select so user can choose which contest start time to display in a table
    var select = document.getElementById('select');
    var startTimes = [];

    for (var i = 0; i < contestData.length; i++) {
            var startTime = contestData[i]['sdstring'];
            // If start time is already in contestData, skip it. Otherwise add to startTimes
            if (!startTimes.includes(startTime)) {
                startTimes.push(startTime);
                var option = document.createElement("option");
                option.text = startTime;
                select.add(option);
            }
    }      
}

// Get player data for the contest start time selected by the user
async function getPlayerData(contestData){
    for(let o of select.options){
        if(o.value != "default"){
            let selectedStartTime = o.innerHTML;
            
            let i = 0;
            while(contestData[i]['sdstring'] != selectedStartTime){
                i++;
            }                        
            var selectedID = contestData[i]['dg'];
            // get contest data from draftkings based on selectedID
            var newurl = "https://www.draftkings.com/lineup/getavailableplayers?contestTypeId=70&draftGroupId="+selectedID+"&gameTypeId=1&sport=NFL";
            let myPromise = new Promise(function(resolve) {
                console.log("new pull");
                let req = new XMLHttpRequest();
                req.open('GET', corsAPI+newurl);
                req.onload = function() {
                    if (req.status == 200) {
                        resolve(req.response);
                    }
                    else {
                        reject(Error(req.statusText));
                        console.log("May need to refresh cors-anywhere.herokuapp.com authorization, or if 429 error, wait due to too many requests.")
                    }
                };
                req.send();
            });
            data = await myPromise;
            var playerData = JSON.parse(data);
            
            addTableRows(playerData, selectedStartTime);
            
        }
    }
}
 
function addTableRows(playerData, selectedStartTime){
    var table = document.getElementById("contestDataTable");
    
    for(let p of playerData['playerList']){
        var row = table.insertRow(-1);
        var cell = row.insertCell(0);
        var img = document.createElement('img');
        img.src = p['imgSm'];
        cell.appendChild(img);
        row.insertCell(1).innerHTML = p['fn'] + " " + p['ln'];
        row.insertCell(2).innerHTML = p['pn'];
        if(p['htid'] == p['tid']){
            row.insertCell(3).innerHTML = p['htabbr'];
        }else{
            row.insertCell(3).innerHTML = p['atabbr'];
        }
        if(p['htid'] == p['tid']){
            row.insertCell(4).innerHTML = p['atabbr'];
        }else{
            row.insertCell(4).innerHTML = p['htabbr'];
        }
        
        row.insertCell(5).innerHTML = p['s'];
        row.insertCell(6).innerHTML = p['pid'];
        row.insertCell(7).innerHTML = p['ppg'];
        row.insertCell(8).innerHTML = selectedStartTime;
        row.insertCell(9).innerHTML = p['ppg'];
    }
    
}
    


// Make contestDataTable sortable
$(function() {
    //$("#contestDataTable").tablesorter(); // Not doing anything since I added my own sort function
    loadTableData();
    fillTeamSelect();
});

// Save contestDataTable data for access at a later date
function saveTableData(){
    var table = document.getElementById("contestDataTable");
    var rows = table.rows;
    var tableData = [];
    for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        var rowData = [];
        for (var j = 0; j < row.cells.length; j++) {
            rowData.push(row.cells[j].innerHTML);
        }
        tableData.push(rowData);
    }
    localStorage.setItem("tableData", JSON.stringify(tableData));
}

// Load contestDataTable data from local storage
function loadTableData(){
    var table = document.getElementById("contestDataTable");
    var tableData = JSON.parse(localStorage.getItem("tableData"));
    for (var i = 0; i < tableData.length; i++) {
        var row = table.insertRow(-1);
        for (var j = 0; j < tableData[i].length; j++) {
            row.insertCell(j).innerHTML = tableData[i][j];
            
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
            playerSummary.rows[8].cells[1].innerHTML = cells[9].innerHTML;

            // Get defense data from defensesTable for opponent based on Abbr in cells[4]
            var defensesTable = document.getElementById("defensesTable");
            var defensesRows = defensesTable.rows;
            var scoringEffect = "";
            var yardsEffect = "";
            for(let r of defensesRows){
                if(r.cells[1].innerHTML == cells[4].innerHTML){
                    scoringEffect += r.cells[5].innerHTML;
                    yardsEffect += r.cells[6].innerHTML;
                }
            }
            playerSummary.rows[3].cells[1].innerHTML += "<br>Scoring Allowed Compared to Average: " + Number(scoringEffect).toFixed(2) + "<br>Yards Allowed Compared to Average: " + Number(yardsEffect).toFixed(2);

                // Highlight row that was clicked
            var rows = table.rows;
            for (var i = 1; i < rows.length; i++) {
                rows[i].style.backgroundColor = "";
            }
            this.style.backgroundColor = "yellow";
            resetInputs();
        });
    }
}

// Add event listeners to updateProjections table
var inputs = document.getElementById("updateProjections").getElementsByTagName("input");
for(let i of inputs){
    i.addEventListener('input', function(){
        updateProjections();
    })
}

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
function resetInputs(){
    var inputs = document.getElementById("updateProjections").getElementsByTagName("input");
    for(let i of inputs){
        i.value = 0;
    }
    document.getElementById("calcProj").innerHTML = 0;
}


// on click of newProjection, replace Projection with calcProj.innerHTML
function newProjection(){
    var proj = document.getElementById("calcProj").innerHTML;
    var playerSummary = document.getElementById("playerSummary");
    playerSummary.rows[8].cells[1].innerHTML = proj;

    var table = document.getElementById("contestDataTable");
    var rows = table.rows;
    for (var i = 1; i < rows.length; i++) {
        if(rows[i].style.backgroundColor == "yellow"){
            rows[i].cells[9].innerHTML = proj;
        }
    }
}

// Scrape defense points allowed projections from fantasypros.com
async function getDefenseProjections(){
    var url = "https://www.fantasypros.com/nfl/projections/dst.php?week=draft";
    let myPromise = new Promise(function(resolve, reject) {
        console.log("new pull");
        let req = new XMLHttpRequest();
        req.open('GET', corsAPI+url);
        req.onload = function() {
            if (req.status == 200) {
                resolve(req.response);
            }
            else {
                reject(Error(req.statusText));
            }
        };
        req.send();
    });
    data = await myPromise;
    
    var parser = new DOMParser();
    var doc = parser.parseFromString(data, "text/html");
    var table = doc.getElementById("data");
    var rows = table.rows;
    var defenseProjections = [];
    for (var i = 1; i < rows.length; i++) {
        var team = rows[i].cells[0].firstChild.innerHTML;
        var sacks = Number(rows[i].cells[1].innerHTML);
        var interceptions = Number(rows[i].cells[2].innerHTML);
        var fumblesRecovered = Number(rows[i].cells[3].innerHTML);
        var touchdowns = Number(rows[i].cells[5].innerHTML);
        var pointsAllowed = Number(rows[i].cells[7].innerHTML);
        var yardsAllowed = Number(rows[i].cells[8].innerHTML.replace(",", ""));
        defenseProjections.push([team, sacks, interceptions, fumblesRecovered, touchdowns, pointsAllowed, yardsAllowed]);
    }
    console.log("defenseProjections: "+ defenseProjections);
    // Calculate means and standard deviations for each stat in defenseProjections
    var statMeans = [];
    var statSDs = [];
    for(let i = 1; i < defenseProjections[0].length; i++){
        var stat = [];
        for(let d of defenseProjections){
            stat.push(d[i]);
        }
        statMeans.push(average(stat));
        statSDs.push(standardDeviation(stat));
    }
    console.log("statMeans: " + statMeans + " statSDs: " + statSDs);
    
    for(let d of defenseProjections){
        for(let i = 1; i < d.length; i++){
            d[i] = (d[i] - statMeans[i-1]) / statSDs[i-1];
        }
    }
    localStorage.setItem("defenseProjections", JSON.stringify(defenseProjections));
    console.log(JSON.parse(localStorage.getItem("defenseProjections")));
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
loadDefenseProjections();

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
        var teamObject = {team:t};
        let wasAssigned = {QB: false, RB1: false, RB2: false, WR1: false, WR2:false,WR3:false, TE: false, DST: false};

        for(let r of cRows){
            if(r.cells[3].innerHTML == t && r.cells[8].innerHTML == document.getElementById("select").value){
                
                if(r.cells[2].innerHTML.includes("QB") && !wasAssigned.QB){
                    teamObject.QB = {player: r.cells[1].innerHTML, proj: r.cells[9].innerHTML, salary: r.cells[5].innerHTML};
                    wasAssigned.QB = true;
                }else if(r.cells[2].innerHTML == "RB" && !wasAssigned.RB1){
                    teamObject.RB1 =  {player: r.cells[1].innerHTML, proj: r.cells[9].innerHTML, salary: r.cells[5].innerHTML};
                    wasAssigned.RB1 = true;
                }else if(r.cells[2].innerHTML == "RB" && !wasAssigned.RB2){
                    teamObject.RB2 = {player: r.cells[1].innerHTML, proj: r.cells[9].innerHTML, salary: r.cells[5].innerHTML};
                    wasAssigned.RB2 = true;
                }else if(r.cells[2].innerHTML == "WR" && !wasAssigned.WR1){
                    teamObject.WR1 =  {player: r.cells[1].innerHTML, proj: r.cells[9].innerHTML, salary: r.cells[5].innerHTML};
                    wasAssigned.WR1 = true;
                }else if(r.cells[2].innerHTML == "WR" && !wasAssigned.WR2){
                    teamObject.WR2 =  {player: r.cells[1].innerHTML, proj: r.cells[9].innerHTML, salary: r.cells[5].innerHTML};
                    wasAssigned.WR2 = true;
                }else if(r.cells[2].innerHTML == "WR" && !wasAssigned.WR3){
                    teamObject.WR3 =  {player: r.cells[1].innerHTML, proj: r.cells[9].innerHTML, salary: r.cells[5].innerHTML};
                    wasAssigned.WR3 = true;
                }else if(r.cells[2].innerHTML == "TE" && !wasAssigned.TE){
                    teamObject.TE =  {player: r.cells[1].innerHTML, proj: r.cells[9].innerHTML, salary: r.cells[5].innerHTML};
                    wasAssigned.TE = true;
                }else if(r.cells[2].innerHTML == "DST" && !wasAssigned.DST){
                    teamObject.DST =  {player: r.cells[1].innerHTML, proj: r.cells[9].innerHTML, salary: r.cells[5].innerHTML};
                    wasAssigned.DST = true;
                }

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

// Solve a draftkings lineup for a given contest start time
function buildLineups(){

    var contestDataTable = document.getElementById("contestDataTable");
    var contestTime = document.getElementById("select").value;
    var players = [];
    var variance = Number(document.getElementById("varianceValue").innerHTML.trim());
    for(let r of contestDataTable.rows){
        if(r.cells[8].innerHTML == contestTime && !r.cells[2].innerHTML.includes("Position")){
            var player = {name: r.cells[1].innerHTML, id: r.cells[6].innerHTML, position: r.cells[2].innerHTML, team: r.cells[3].innerHTML, opponent: r.cells[4].innerHTML, salary: r.cells[5].innerHTML, proj: (Number(r.cells[9].innerHTML*variance/100*(Math.random()*2-1))+Number(r.cells[9].innerHTML)).toFixed(1)};
            players.push(player);
        }
    }
    optimizeClassic(players);
/*
    let myPromise = new Promise(function(resolve) {
        
        
        
        var contestDataTable = document.getElementById("contestDataTable");
        var contestTime = document.getElementById("select").value;
        var players = [];
        for(let r of contestDataTable.rows){
            if(r.cells[8].innerHTML == contestTime && !r.cells[2].innerHTML.includes("Position")){
                var player = {name: r.cells[1].innerHTML, id: r.cells[6].innerHTML, position: r.cells[2].innerHTML, team: r.cells[3].innerHTML, opponent: r.cells[4].innerHTML, salary: r.cells[5].innerHTML, proj: r.cells[9].innerHTML};
                players.push(player);
            }
        }
        resolve(optimizeClassic(players));

    });
    var lineup = await myPromise;//optimizeClassic(players);
    console.log(lineup);
    addLineup(lineup);
    */
}

// Solve a DraftKings classic lineup for a given contest start time
// Solver from https://github.com/JWally/jsLPSolver
function optimizeClassic(players){
    //var lineup = [];
    //var positions = ["QB", "RB", "RB", "WR", "WR", "WR", "TE", "FLEX", "DST"];
    var salaryCap = 50000;
    var QBs = [];
    var RBs = [];
    var WRs = [];
    var TEs = [];
    var FLEXs = [];
    var DSTs = [];
    for(let p of players){
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
    var modelVariables = {};
    for(let p of QBs){
        let pid = p.id;
        modelVariables[p.name] = {"proj": p.proj, "salary": p.salary, "QB": 1, "i": 1};
        modelVariables[p.name][pid] = 1;
    }
    for(let p of RBs){
        let pid = p.id;
        modelVariables[p.name] = {"id": p.id, "proj": p.proj, "salary": p.salary, "RB": 1, "FLEX": 1, "i": 1};
        modelVariables[p.name][pid] = 1;
    }
    for(let p of WRs){
        let pid = p.id;
        modelVariables[p.name] = {"id": p.id, "proj": p.proj, "salary": p.salary, "WR": 1, "FLEX": 1, "i": 1};
        modelVariables[p.name][pid] = 1;
    }
    for(let p of TEs){
        let pid = p.id;
        modelVariables[p.name] = {"id": p.id,"proj": p.proj, "salary": p.salary, "TE": 1, "FLEX": 1, "i": 1};
        modelVariables[p.name][pid] = 1;
    }
    for(let p of DSTs){
        let pid = p.id;
        modelVariables[p.name] = {"id": p.id,"proj": p.proj, "salary": p.salary, "DST": 1, "i": 1};
        modelVariables[p.name][pid] = 1;
    }


    var results;
    require(['solver'], function(solver) {
        var model = {
            "optimize": "proj",
            "opType": "max",
            "constraints": {
                "salary": {"max": salaryCap},
                "QB": {"equal": 1},
                "RB": {"min": 2},
                "WR": {"min": 3},
                "TE": {"min": 1},
                "FLEX": {"equal": 7},
                "DST": {"equal": 1},
                "i": {"equal": 9}
            },  
            "variables": modelVariables,
            "ints": {}
        };

        for(let p of players){
            model.constraints[p.id] = {"max": 1};
            model.ints[p.name] = 1;
        }
        //console.log(solver);
        //console.log(model);
        results = solver.Solve(model);
        addLineup(results, players);
    });

    //return results;
    
    
}

// Add lineup to lineupTable - classic
function addLineup(lineup,players){
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

    for(let p of orderedLineup){
        var cell = row.insertCell(-1);
        cell.innerHTML = p.name + "<br>" + p.team + "<br>" + p.salary + "<br>" + p.proj;
    }
}


function pickBuilder(section, event){
    var builderButtons = document.getElementsByClassName("builderButton");
    for(let b of builderButtons){
        b.style.backgroundColor = "#272727";
    }
    event.target.style.backgroundColor = "blue";
    var builderSections = document.getElementsByClassName("builderSection");
    for(let s of builderSections){
        if(s.id == section){
            s.style.display = "block";
        }else{
            s.style.display = "none";
        }
    }
}

// Create a showdown lineup for a given contest start time
function buildShowdownLineups(){
    var contestDataTable = document.getElementById("contestDataTable");
    var contestTime = document.getElementById("select").value;
    var players = [];
    var variance = Number(document.getElementById("varianceValue").innerHTML.trim());

    for(let r of contestDataTable.rows){
        if(r.cells[8].innerHTML == contestTime && !r.cells[2].innerHTML.includes("Position")){
            var player = {name: r.cells[1].innerHTML, id: r.cells[6].innerHTML, position: r.cells[2].innerHTML, team: r.cells[3].innerHTML, opponent: r.cells[4].innerHTML, salary: r.cells[5].innerHTML, proj: (Number(r.cells[9].innerHTML*variance/100*(Math.random()*2-1))+Number(r.cells[9].innerHTML)).toFixed(1)};
            players.push(player);
        }
    }
    optimizeShowdown(players);
}

// Solve a DraftKings showdown lineup for a given contest start time
function optimizeShowdown(players){
    var modelVariables = {};
    for(let p of players){
        let pid = p.id;
        let pteam = p.team;
        modelVariables[p.name] = {"proj": p.proj, "salary": p.salary, "i": 1, "CPT": 0};
        modelVariables[p.name][pid] = 1;
        modelVariables[p.name][pteam] = 1;

        modelVariables["CPT "+p.name] = {"proj": p.proj * 1.5, "salary": p.salary * 1.5, "i": 1, "CPT": 1};
        modelVariables["CPT "+p.name][pid] = 1;
        modelVariables["CPT "+p.name][pteam] = 1;
    }


    var results;
    require(['solver'], function(solver) {
        var model = {
            "optimize": "proj",
            "opType": "max",
            "constraints": {
                "salary": {"max": 50000},
                "i": {"equal": 6},
                "CPT": {"equal": 1}
            },  
            "variables": modelVariables,
            "ints": {}
        };

        for(let p of players){
            model.constraints[p.id] = {"max": 1};
            model.constraints[p.team] = {"max": 5};
            model.ints[p.name] = 1;
            model.ints["CPT "+p.name] = 1;
        }
        //console.log(solver);
        //console.log(model);
        results = solver.Solve(model);
        addLineupShowdown(results, players);
    });
}

// Add lineup to showdownLineupTable
function addLineupShowdown(lineup,players){
    console.log(lineup);
    var lineupTable = document.getElementById("showdownLineupTable");
    var row = lineupTable.insertRow(-1);
    var lineupForTable = [];
    for(let k of Object.keys(lineup)){
        if(k != "feasible" && k != "result" && k != "bounded" && k != "iterations" && k != "time" && k != "dual" && k != "primal" && k != "isIntegral"){
            var found = false, x=0, isCPT = false;
            while(!found && x < players.length){
                if(players[x].name.trim() == k.trim()){ 
                    found = true; 
                } else if(players[x].name.trim() == k.replace("CPT ", "").trim()){
                    found = true;
                    isCPT = true;
                } else x++;
            }
            if(isCPT){
                lineupForTable.push({name: "CPT "+players[x].name, team: players[x].team, salary: players[x].salary*1.5, proj: players[x].proj * 1.5});
            }else{
                lineupForTable.push(players[x]);
            }
        }
    }
    // order lineupForTable by position
    var cpts = [];
    var flexs = [];
    console.log(lineupForTable);
    for(let p of lineupForTable){
        if(p.name.includes("CPT")){
            cpts.push(p);
        }else{
            flexs.push(p);
        }
    }

    var orderedLineup = [];
    for(let p of cpts){
        orderedLineup.push(p);
    }
    for(let p of flexs){
        orderedLineup.push(p);
    }

    for(let p of orderedLineup){
        var cell = row.insertCell(-1);
        cell.innerHTML = p.name + "<br>" + p.team + "<br>" + p.salary + "<br>" + Number(p.proj).toFixed(1);
    }
}

// Add variance to lineup builder based on slider value
function updateSlider(){
    var slider = document.getElementById("varianceSlider");
    var variance = slider.value;
    document.getElementById("varianceValue").innerHTML = variance;
}

// Causes slate change from "Builder" tab to update "Contest Info" tab
function updateOtherSelect(){
    var otherSelect = document.getElementById("select2").value;
    document.getElementById("select").value = otherSelect;
}