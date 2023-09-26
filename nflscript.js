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
        if(!ids.includes(p['ID'])) {
            ids.push(p['ID'].trim());
            var row = table.insertRow(-1);
            row.insertCell(0).innerHTML = (p['Game Info'].split(" ")[0] + " " + p['Game Info'].split(" ")[2]).trim();
            row.insertCell(1).innerHTML = p['Name'].trim();
            if(p['Roster Position'] == 'FLEX' || p['Roster Position'] == 'CPT') {
                row.insertCell(2).innerHTML = p['Roster Position'].trim();
                if(p['Position'] == 'DST'){ 
                    row.cells[2].setAttribute("defense", "true");
                }
                if(p['Position'] == 'K') row.cells[2].setAttribute("kicker", "kicker");
                if(p['Position'] == 'QB') row.cells[2].setAttribute("pos", "qb");
                if(p['Position'] == 'RB') row.cells[2].setAttribute("pos", "rb");
                if(p['Position'] == 'WR') row.cells[2].setAttribute("pos", "wr");
                if(p['Position'] == 'TE') row.cells[2].setAttribute("pos", "te");

            } else row.insertCell(2).innerHTML = p['Position'].trim();
            row.insertCell(3).innerHTML = p['TeamAbbrev'].trim();
            row.insertCell(4).innerHTML = p['Game Info'].split(" ")[0].replace("@" , "").replace(p['TeamAbbrev'], "").trim();
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
    getDefenseProjections();
    updateProjectionsFromMedians();
    adjustProjectionsByInjuries();
    captainize();

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
            let proj = row.cells[j].getAttribute("projections");
            if(proj != null && proj != undefined && proj != ""){
                let sumProj = 0;
                for(let p of Object.values(JSON.parse(proj))){
                    sumProj += Number(p);
                }
                if(sumProj > 0) rowData.push(proj); else rowData.push(0);
            }
            
        }
        let dst = row.cells[2].getAttribute("defense");
        if(dst != null && dst != undefined && dst != ""){
            rowData.push(dst);
        }
        let k = row.cells[2].getAttribute("kicker");
        if(k != null && k != undefined && k != ""){rowData.push(k);}
        let x = row.cells[2].getAttribute("pos");
        if(x != null && x != undefined && x != ""){rowData.push(x);}

        tableData.push(rowData);

    }
    localStorage.setItem("tableData", JSON.stringify(tableData));
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
    for (var i = 0; i < tableData.length; i++) {
        var row = table.insertRow(-1);
        for (var j = 0; j < 11; j++) {
            if(j == 10){
                if(tableData[i][j] == "true") {
                    row.cells[2].setAttribute("defense", "true");
                    row.cells[2].setAttribute("pos", "DST");
                } else if(tableData[i][j] == "kicker"){ 
                    row.cells[2].setAttribute("kicker", "kicker");
                    row.cells[2].setAttribute("pos", "K");
                } else {
                    if(row.length == 11) row.cells[2].setAttribute("pos", tableData[i][j]); else row.cells[2].setAttribute("pos", tableData[i][j+1]);
                }
                
            }else {
                row.insertCell(j).innerHTML = tableData[i][j];
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
            playerSummary.rows[8].cells[1].innerHTML = cells[9].innerHTML;

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
            playerSummary.rows[3].cells[1].innerHTML += "<br>Scoring Allowed Compared to Average: " + Number(scoringEffect).toFixed(2) + "<br>Yards Allowed Compared to Average: " + Number(yardsEffect).toFixed(2);

            // Highlight row that was clicked
            colorTableRows();
            this.style.backgroundColor = "yellow";
            this.style.color = "black";
            resetInputs(this);
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
                }else if((r.cells[2].innerHTML == "DST"  || (r.cells[2].innerHTML == "FLEX" && r.cells[2].getAttribute("defense") == "true"))&& !wasAssigned.DST && r.cells[3].innerHTML == t){
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
function buildLineups(){
    var contestTime = document.getElementById("select").value;
    if(contestTime == "All slates") alert("Please select a slate"); else{
        var lineupsToBuild = Number(document.getElementById("lineupsToBuild").value);
        localStorage.notFeasible = 0; 
        for(let i = 0; i < lineupsToBuild; i++){
            optimizeClassic(generateProjections());
        }
    }
}

// Randomize projection
function randomizeProjection(proj, position){
    var variance = Number(document.getElementById("varianceValue").innerHTML.trim());
    if(proj <= 0) return 0;
    // curveLean is how much the curve leans away from the mean; 
    // under .5 means it leans right, over .5 means it leans left
    var curveLean = 0.5;

    // varianceStrength is how much variance affects the projections
    var varianceStrength = 1.5;

    // random number between 0 and 1
    var rand = randomNormal();

    switch(position){
        case "QB":
            curveLean = 0.7;
            varianceStrength = 1.8;
            break;
        case "RB":
            curveLean = .65;
            varianceStrength = 1.8;
            break;
        case "WR":
            curveLean = .5;
            varianceStrength = 1.8;
            break;
        case "TE":
            curveLean = .65;
            varianceStrength = 1.5;
            break;
        case "DST":
            curveLean = .7;
            varianceStrength = 1.2;
            break;
        case "K":
            curveLean = .5;
            varianceStrength = 1;
    }

    var thisProj = Number(proj);
    variance = (variance*varianceStrength+thisProj*.5)*(rand-curveLean); // variance is higher for higher projections; manipulated by randomness and curveLean
    if(thisProj <= 0) return 0.5;
    
    return (thisProj+variance).toFixed(1);
}

// Return a randomized number between 0 and 1 with a normal distribution and mean of .5
function randomNormal(){
    var rand = 0;
    for (var i = 0; i < 6; i += 1) {
        rand += Math.random();
    }
    return rand / 6;
}


// Solve a DraftKings classic lineup for a given contest start time
// Solver from https://github.com/JWally/jsLPSolver
function optimizeClassic(players){
    var minStack = Number(document.getElementById("minStack").value);
    var maxStack = Number(document.getElementById("maxStack").value);
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
        if(p.proj > 3){
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
        modelVariables[p.name] = {"proj": p.proj, "salary": p.salary, "QB": 1, "i": 1};
        modelVariables[p.name][pid] = 1;
        modelVariables[p.name][pstack] = minStack;
        modelVariables[p.name]["team"] = p.team;
    }
    for(let p of RBs){
        let pid = p.id;
        let pstack = p.team+"QB";
        modelVariables[p.name] = {"id": p.id, "proj": p.proj, "salary": p.salary, "RB": 1, "FLEX": 1, "i": 1};
        modelVariables[p.name][pid] = 1;
        modelVariables[p.name][pstack] = -1;
        modelVariables[p.name]["team"] = p.team;
    }
    for(let p of WRs){
        let pid = p.id;
        let pstack = p.team+"QB";
        modelVariables[p.name] = {"id": p.id, "proj": p.proj, "salary": p.salary, "WR": 1, "FLEX": 1, "i": 1};
        modelVariables[p.name][pid] = 1;
        modelVariables[p.name][pstack] = -1;
        modelVariables[p.name]["team"] = p.team;
    }
    for(let p of TEs){
        let pid = p.id;
        let pstack = p.team+"QB";
        modelVariables[p.name] = {"id": p.id,"proj": p.proj, "salary": p.salary, "TE": 1, "FLEX": 1, "i": 1};
        modelVariables[p.name][pid] = 1;
        modelVariables[p.name][pstack] = -1;
        modelVariables[p.name]["team"] = p.team;
    }
    for(let p of DSTs){
        let pid = p.id;
        modelVariables[p.name] = {"id": p.id,"proj": p.proj, "salary": p.salary, "DST": 1, "i": 1};
        modelVariables[p.name][pid] = 1;
        modelVariables[p.name]["team"] = p.team;
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
        for(let p of Object.keys(modelVariables)){
            let player = modelVariables[p];
            let pid = player['id'];
            if(pid== undefined) continue;

            model.constraints[pid] = {"max": 1};
            model.ints[p] = 1;
            if(!model.constraints[player.team+"QB"]) {
                model.constraints[player.team+"QB"] = {"max": 0, "min": 1-maxStack};
            }
        }
        results = solver.Solve(model);
        // make sure it's not already in our lineups
        if(!results.feasible) {
            if(localStorage.notFeasible == undefined) localStorage.notFeasible = 1; else localStorage.notFeasible = Number(localStorage.notFeasible)++;
            if(Number(localStorage.notFeasible) > 10) {
                alert("No more lineups available");
                return;
            } else optimizeClassic(generateProjections());
        } else {
            console.log(results);
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
    ownershipTable.innerHTML = "<tr><th>Player</th><th>Ownership</th></tr>";

    for(let p of Object.keys(players)){
        var row = ownershipTable.insertRow(-1);
        row.insertCell(0).innerHTML = p;
        row.insertCell(1).innerHTML = players[p];
    }
    sortTable("ownership", 1);
}


// Toggle elements based on contest type
function pickBuilder(section){
   
    
    var classicBuilder = document.getElementsByClassName("classicBuilder"); 
    var showdownBuilder = document.getElementsByClassName("showdownBuilder");
    
    
    if(section == "Classic") {
        for(let c of classicBuilder){
            c.style.display = "";
        }
        for(let c of showdownBuilder){
            c.style.display = "none";
        }
    } else{
        for(let c of classicBuilder){
            c.style.display = "none";
        }
        for(let c of showdownBuilder){
            c.style.display = "";
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
            optimizeShowdown(generateProjections());
        }   
    }
}

// Generate new projections
function generateProjections(){
    var contestDataTable = document.getElementById("contestDataTable");
    var contestTime = document.getElementById("select").value;
    var players = [];

    for(let r of contestDataTable.rows){
        if(r.cells[8].innerHTML == contestTime && !r.cells[2].innerHTML.includes("Position")){
            var player = {name: r.cells[1].innerHTML, id: r.cells[6].innerHTML, position: r.cells[2].innerHTML, team: r.cells[3].innerHTML, opponent: r.cells[4].innerHTML, salary: r.cells[5].innerHTML, proj: randomizeProjection(r.cells[9].innerHTML, r.cells[2].innerHTML)};
            if(player.position == "FLEX" || player.position == "CPT"){
                player.rosterPosition = player.position;
                player.position = r.cells[2].getAttribute("pos");
            }
            players.push(player);
        }
    }
    players = correlateByTeam(players);

    return players;
}

// Manipulate projections to correlate by team
function correlateByTeam(players){
    var teamProjections = {};
    for(let p of players){
        if(teamProjections[p.team] == undefined){
            teamProjections[p.team] = {correlate: (randomNormal()*3-1.5)};
        }
    }
    for(let p of players){
        switch(p.position){
            case "QB":
                p.proj = (p.proj * (1 + teamProjections[p.team].correlate * .75+teamProjections[p.opponent].correlate * .5)).toFixed(1);
                break;
            case "RB":
                p.proj = (p.proj * (1 + teamProjections[p.team].correlate * .05-teamProjections[p.opponent].correlate * .15)).toFixed(1);
                break;
            case "WR":
                p.proj = (p.proj * (1 + teamProjections[p.team].correlate * .65+teamProjections[p.opponent].correlate * .3)).toFixed(1);
                break;
            case "TE":
                p.proj = (p.proj * (1 + teamProjections[p.team].correlate * .4)).toFixed(1);
                break;
            case "DST":
                p.proj = (p.proj * (1 - teamProjections[p.opponent].correlate * 0.8 + teamProjections[p.team].correlate * .2)).toFixed(1);
                break;
            case "K":
                p.proj = (p.proj * (1 + teamProjections[p.team].correlate * .2-teamProjections[p.opponent].correlate * .2)).toFixed(1);
                break;
            default: 
                p.proj = (p.proj * (1 + teamProjections[p.team].correlate * .5)).toFixed(1);
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
    for(let p of players){
        if(p.proj <= 0) continue;
        let n = p.name;
        let t = p.team;
        if(!teams.includes(t)) teams.push(t);
                
        if(p.rosterPosition == "CPT"){
            modelVariables["CPT " + n] = {"proj": p.proj, "salary": p.salary, "CPT": '1', "i": '1'};
            modelVariables["CPT " + n][n] = '1';
            modelVariables["CPT " + n][t] = '1';
        }else{
            modelVariables[n] = {"proj": p.proj, "salary": p.salary, "i": '1'};
            modelVariables[n][n] = '1';
            modelVariables[n][t] = '1';

        }

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
        for(let k of Object.keys(modelVariables)){
            let p = modelVariables[k];
            model.constraints[p.name] = {"max": '1'};
            //model.constraints[p.team] = {"max": '5'};
            model.constraints[k] = {"max": '1'};
            model.ints[k] = '1';
        }
        for(let t of teams){
            model.constraints[t] = {"max": '5'};
        }

        results = solver.Solve(model);
        // make sure it's not already in our lineups

        if(!results.feasible) {
            if(localStorage.notFeasible == undefined) localStorage.notFeasible = 1; else localStorage.notFeasible = Number(localStorage.notFeasible)++;
            if(Number(localStorage.notFeasible) > 10) {
                alert("No more lineups available");
                return;
            } else optimizeClassic(generateProjections());
        } else {
            var alreadyBuilt = false;
            var thisLineup = [];
            var cpt = "";
            for(let k of Object.keys(results)){
                if(k != "feasible" && k != "result" && k != "bounded" && k != "iterations" && k != "time" && k != "dual" && k != "primal" && k != "isIntegral"){
                    var x=0;
                    while(x < players.length){
                        if(players[x].name.trim() === k.trim()){ 
                            thisLineup.push(players[x].name); 
                        } else if(players[x].name.trim() === k.replace("CPT ", "").trim()){
                            cpt = players[x].name;
                        } 
                        x++;
                    }
                    
                }
            }
            thisLineup = sortArray(thisLineup);
            thisLineup.push(cpt);
            //thisLineup = JSON.stringify(thisLineup);
            var builtLineups = getBuiltShowdownLineups();
            for(let l of builtLineups){
                if(JSON.stringify(l) == JSON.stringify(thisLineup)) alreadyBuilt = true;
            }
            if(!alreadyBuilt && thisLineup.length == 6) setTimeout(addLineupShowdown(results, players), 100); else(optimizeShowdown(generateProjections()));
        }
    });
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
    while(lineupTable.rows.length > 1){
        lineupTable.deleteRow(-1);
    }
    while(showdownLineupTable.rows.length > 1){
        showdownLineupTable.deleteRow(-1);
    }
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




// Add lineup to showdownLineupTable
function addLineupShowdown(lineup,players){
    //setTimeout(function(){return;}, 1000);
    var lineupTable = document.getElementById("showdownLineupTable");
    var row = lineupTable.insertRow(-1);
    var lineupForTable = [];
    for(let k of Object.keys(lineup)){
        if(k != "feasible" && k != "result" && k != "bounded" && k != "iterations" && k != "time" && k != "dual" && k != "primal" && k != "isIntegral"){
            var found = false, x=0;
            while(!found && x < players.length){
                if(players[x].name.trim() == k.replace("CPT ", "").trim()) {
                    if(k.includes("CPT")){
                        if(players[x]["rosterPosition"] == 'CPT'){
                            found = true; 
                            lineupForTable.push(players[x]);
                        } else x++;
                    }else{
                        if(players[x]["rosterPosition"] != 'CPT'){
                            found = true; 
                            lineupForTable.push(players[x]);
                        } else x++;
                    }
                }else x++;
            }

        }
        
    }
    
    // order lineupForTable by position
    var cpts = [];
    var flexs = [];
    var totalProj =0;
    var totalSalary = 0;
    for(let p of lineupForTable){
        if(p.rosterPosition == "CPT"){
            cpts.push(p);
        }else{
            flexs.push(p);
        }
        totalProj += Number(p.proj);
        totalSalary += Number(p.salary);
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
    row.insertCell(-1).innerHTML = totalSalary;
    row.insertCell(-1).innerHTML = totalProj.toFixed(1);

    // Update ShowdownLineupsBuilt to num rows -1
    document.getElementById("showdownLineupsBuilt").innerHTML = lineupTable.rows.length-1;

    updateShowdownOwnership();
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
            row.insertCell(-1).innerHTML = (players[p].cpt/table.rows.length*100).toFixed(1);
            row.insertCell(-1).innerHTML = (players[p].flex/table.rows.length*100).toFixed(1);
            row.insertCell(-1).innerHTML = ((players[p].cpt+players[p].flex)/table.rows.length*100).toFixed(1);
        }
    }
    sortTable("showdownOwnership", 3);
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
    }else{
        pickBuilder('Classic');
    }
}

// Get player medians from storage, if it exists
function getPlayerMedians(){
    var table = document.getElementById("playerMediansTable");
    var players = document.getElementById("contestDataTable").rows;
    var playerMedians = getInfoFromJSON('playerMedians.json');
    var ths = table.getElementsByTagName("th");
    var teams = [];
    var list = [];
    for(let p of players){
        if(!teams.includes(p.cells[3].innerHTML.trim()) && p.cells[1].innerHTML != "Player"){
            teams.push(p.cells[3].innerHTML.trim());
        }
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
    }
    var teamSelect = document.getElementById("teamSelectMedians");
    for(let t of teams){
        var option = document.createElement("option");
        option.text = t;
        teamSelect.add(option);
    }

}

// Update player medians in storage
function updatePlayerMedians(){
    var table = document.getElementById("playerMediansTable");
    var rows = table.rows;
    var playerMedians = {};
    for(let r of rows){
        if(r.rowIndex == 0) continue;
        var name = r.cells[1].innerHTML;
        playerMedians[name] = {};
        var ths = table.getElementsByTagName("th");
        for(let t of ths){
            if(["Game", "Name", "Position", "Team"].includes(t.innerHTML)) continue;
            var slider = document.getElementById(name+t.innerHTML+"Slider");
            playerMedians[name][t.innerHTML] = slider.value;
        }
    }
    localStorage.playerMedians = JSON.stringify(playerMedians);
    saveToFile(localStorage.playerMedians, "playerMedians.txt");
}

// Update feedback for slider input
function updateProjectionSlider(id){
    var slider = document.getElementById(id);
    var label = slider.previousElementSibling;
    label.innerHTML = slider.value;
    populateSumOfLabels()
}

function filterTeamsMedians(){
    var table = document.getElementById("playerMediansTable");
    var rows = table.rows;
    var team = document.getElementById("teamSelectMedians").value;
    for(let r of rows){
        if(r.rowIndex == 0) continue;
        if(r.cells[3].innerHTML.trim() == team || team == "All"){
            r.style.display = "";
        }else{
            r.style.display = "none";
        }
    }
    
    populateSumOfLabels();
}

// Populate sum of labels in player medians table
function populateSumOfLabels(){
    var sumOfLabels = document.getElementById("sumOfLabels");
    sumOfLabels.style.display = "";
    var table = document.getElementById("playerMediansTable");
    var rows = table.rows;
    var sums = [0,0,0,0,0,0,0,0];
    for(let r of rows){
        if(r.rowIndex == 0) continue;
        if(r.style.display != "none"){
            var ths = table.getElementsByTagName("th");
            for(let t of ths){
                if(["Game", "Name", "Position", "Team"].includes(t.innerHTML)) continue;
                var slider = document.getElementById(r.cells[1].innerHTML+t.innerHTML+"Slider");
                sums[t.cellIndex-4] += Number(slider.value);
            }
        }
    }
    var solData = sumOfLabels.rows[1].cells;
    for(let i = 0; i < sums.length; i++){
        solData[i].innerHTML = sums[i];
    }
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
            for(let c of categories){
                
                if(playerProjections[c] == undefined || teamProjections[c] == undefined){
                    newProjections[c] = 0;
                } else{
                    newProjections[c] = Number(playerProjections[c]) * Number(teamProjections[c])/100;
                }
            }
            r.cells[9].setAttribute("projections", JSON.stringify(newProjections));
            r.cells[9].innerHTML = ((newProjections["Passing Yards"] * 0.04) + (newProjections["Passing TDs"] * 4) + (newProjections["Interceptions"] * -1) + (newProjections["Rushing Yards"] * 0.1) + (newProjections["Rushing TDs"] * 6) + (newProjections["Receptions"] * 1) + (newProjections["Receiving Yards"] * 0.1) + (newProjections["Receiving TDs"] * 6)).toFixed(1);
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
}

// Download lineups from builder as CSV
function downloadLineups(){
    var lineups = document.getElementById("lineupTable").rows;
    var csv = "data:text/csv;charset=utf-8,";
    csv += "QB,RB,RB,WR,WR,WR,TE,FLEX,DST\n";
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
    console.log(name, position);
    while(!found){
        if(rows[x].cells[1].innerHTML == name && (rows[x].cells[2].innerHTML == position || (position == "FLEX" && (rows[x].cells[2].innerHTML == "RB" || rows[x].cells[2].innerHTML == "WR" || rows[x].cells[2].innerHTML == "TE")))){
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
    //var allTables = document.getElementsByTagName("table"); // This works, but is disorienting on some tables
    //for(let t of allTables){
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
    //}
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
        if(p.cells[2].innerHTML == "DST" || p.cells[2].getAttribute("defense") == "true"){
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

        defenseEffect[defense] = {pointsAllowed: pointsAllowed, yardsAllowed: yardsAllowed};
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
    cell.innerHTML = '<input type="text" class="injuryName injury" onchange="updateInjuryTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<input type="text" class="injuryB1 injury" onchange="updateInjuryTable()"><input type="number" class="injuryB1Pct injury" onchange="updateInjuryTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<input type="text" class="injuryB2 injury" onchange="updateInjuryTable()"><input type="number" class="injuryB2Pct injury" onchange="updateInjuryTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<input type="text" class="injuryB3 injury" onchange="updateInjuryTable()"><input type="number" class="injuryB3Pct injury" onchange="updateInjuryTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<input type="text" class="injuryB4 injury" onchange="updateInjuryTable()"><input type="number" class="injuryB4Pct injury" onchange="updateInjuryTable()">';
    cell = row.insertCell(-1);
    cell.innerHTML = '<input type="text" class="injuryB5 injury" onchange="updateInjuryTable()"><input type="number" class="injuryB5Pct injury" onchange="updateInjuryTable()">';
    
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
        cell.innerHTML = '<input type="text" class="injuryName injury" onchange="updateInjuryTable()" value="'+i.name+'">';
        cell = row.insertCell(-1);
        cell.innerHTML = '<input type="text" class="injuryB1 injury" onchange="updateInjuryTable()" value="'+i.b1+'"><input type="number" class="injuryB1Pct injury" onchange="updateInjuryTable()" value="'+i.b1Pct+'">';
        cell = row.insertCell(-1);
        cell.innerHTML = '<input type="text" class="injuryB2 injury" onchange="updateInjuryTable()" value="'+i.b2+'"><input type="number" class="injuryB2Pct injury" onchange="updateInjuryTable()" value="'+i.b2Pct+'">';
        cell = row.insertCell(-1);
        cell.innerHTML = '<input type="text" class="injuryB3 injury" onchange="updateInjuryTable()" value="'+i.b3+'"><input type="number" class="injuryB3Pct injury" onchange="updateInjuryTable()" value="'+i.b3Pct+'">';
        cell = row.insertCell(-1);
        cell.innerHTML = '<input type="text" class="injuryB4 injury" onchange="updateInjuryTable()" value="'+i.b4+'"><input type="number" class="injuryB4Pct injury" onchange="updateInjuryTable()" value="'+i.b4Pct+'">';
        cell = row.insertCell(-1);
        cell.innerHTML = '<input type="text" class="injuryB5 injury" onchange="updateInjuryTable()" value="'+i.b5+'"><input type="number" class="injuryB5Pct injury" onchange="updateInjuryTable()" value="'+i.b5Pct+'">';
    }
}

// Update projections based on injuries
function adjustProjectionsByInjuries(){
    var players = document.getElementById("contestDataTable").rows;
    if(localStorage.injuries == undefined) return;
    var injuries = JSON.parse(localStorage.injuries);
    var playerMedians = document.getElementById("playerMediansTable").rows;

    for(let i of injuries){
        var medianProjections = {};
        for(let m of playerMedians){
            if(i.name.trim() == m.cells[1].innerHTML.trim()){
                
                var ths = document.getElementById("playerMediansTable").getElementsByTagName("th");
                for(let t of ths){
                    if(["Game", "Name", "Position", "Team"].includes(t.innerHTML)) continue;
                    var slider = document.getElementById(m.cells[1].innerHTML.trim()+t.innerHTML+"Slider");
                    medianProjections[t.innerHTML] = slider.value;
                }
            }
        }
        var found = [];
        var x = 0;
        while(x < players.length){
            if(players[x].cells[1].innerHTML.trim() == i.name.trim()){
                found.push(x);
                x++;
            }else{
                x++;
            }
        }
        if(found.length==0) continue;
        var playerProjections = JSON.parse(players[found[0]].cells[9].getAttribute("projections"));
        for(let r in players){
            var p = players[r];
            // continue if p is not a row
            if(p.rowIndex == 0) continue;
            // continue if p is not a tr element
            if(p.tagName != "TR") continue;


            if(p.cells[1].innerHTML.trim() == i.b1.trim()){
                var b1Projections = JSON.parse(p.cells[9].getAttribute("projections"));
                var newProj = addInjuryBenefit(playerProjections, b1Projections, i.b1Pct);
                p.cells[9].setAttribute("projections", JSON.stringify(newProj));
                p.cells[9].innerHTML = ((newProj["Passing Yards"] * 0.04) + (newProj["Passing TDs"] * 4) + (newProj["Interceptions"] * -1) + (newProj["Rushing Yards"] * 0.1) + (newProj["Rushing TDs"] * 6) + (newProj["Receptions"] * 1) + (newProj["Receiving Yards"] * 0.1) + (newProj["Receiving TDs"] * 6)).toFixed(1);
            }
            if(p.cells[1].innerHTML.trim() == i.b2.trim()){
                var b2Projections = JSON.parse(p.cells[9].getAttribute("projections"));
                var newProj = addInjuryBenefit(playerProjections, b2Projections, i.b2Pct);
                p.cells[9].setAttribute("projections", JSON.stringify(newProj));
                p.cells[9].innerHTML = ((newProj["Passing Yards"] * 0.04) + (newProj["Passing TDs"] * 4) + (newProj["Interceptions"] * -1) + (newProj["Rushing Yards"] * 0.1) + (newProj["Rushing TDs"] * 6) + (newProj["Receptions"] * 1) + (newProj["Receiving Yards"] * 0.1) + (newProj["Receiving TDs"] * 6)).toFixed(1);
            }
            if(p.cells[1].innerHTML.trim() == i.b3.trim()){
                var b3Projections = JSON.parse(p.cells[9].getAttribute("projections"));
                var newProj = addInjuryBenefit(playerProjections, b3Projections, i.b3Pct);
                p.cells[9].setAttribute("projections", JSON.stringify(newProj));
                p.cells[9].innerHTML = ((newProj["Passing Yards"] * 0.04) + (newProj["Passing TDs"] * 4) + (newProj["Interceptions"] * -1) + (newProj["Rushing Yards"] * 0.1) + (newProj["Rushing TDs"] * 6) + (newProj["Receptions"] * 1) + (newProj["Receiving Yards"] * 0.1) + (newProj["Receiving TDs"] * 6)).toFixed(1);
            }
            if(p.cells[1].innerHTML.trim() == i.b4.trim()){
                var b4Projections = JSON.parse(p.cells[9].getAttribute("projections"));
                var newProj = addInjuryBenefit(playerProjections, b4Projections, i.b4Pct);
                p.cells[9].setAttribute("projections", JSON.stringify(newProj));
                p.cells[9].innerHTML = ((newProj["Passing Yards"] * 0.04) + (newProj["Passing TDs"] * 4) + (newProj["Interceptions"] * -1) + (newProj["Rushing Yards"] * 0.1) + (newProj["Rushing TDs"] * 6) + (newProj["Receptions"] * 1) + (newProj["Receiving Yards"] * 0.1) + (newProj["Receiving TDs"] * 6)).toFixed(1);
            }
            if(p.cells[1].innerHTML.trim() == i.b5.trim()){
                var b5Projections = JSON.parse(p.cells[9].getAttribute("projections"));
                var newProj = addInjuryBenefit(playerProjections, b5Projections, i.b5Pct);
                p.cells[9].setAttribute("projections", JSON.stringify(newProj));
                p.cells[9].innerHTML = ((newProj["Passing Yards"] * 0.04) + (newProj["Passing TDs"] * 4) + (newProj["Interceptions"] * -1) + (newProj["Rushing Yards"] * 0.1) + (newProj["Rushing TDs"] * 6) + (newProj["Receptions"] * 1) + (newProj["Receiving Yards"] * 0.1) + (newProj["Receiving TDs"] * 6)).toFixed(1);
            }
        }
        for(let x of found){
            players[x].cells[9].setAttribute("projections", "");
            players[x].cells[9].innerHTML = 0;
        }
    }
}

// Add injury benefit to player projections
function addInjuryBenefit(playerProjections, bProjections, bPct){
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