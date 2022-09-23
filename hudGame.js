//CANVAS VARIABLES
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
canvas.width = innerWidth
canvas.height = innerHeight
const STOPLIGHTCYCLETIME = 500

//SIMULATION STATES/MODES
ROADPLACEMODE = true
MOUSEDOWN = false
building = false
var gameRunning = false
carsMoving = true
netRunning = false
chartExists = false

//GRAPH VARIABLES
GRAPHVALUES = []
qChart = null
savedGraph = []
chartFrozen = false

//ARRAYS FOR SYSTEM
ROAD_ARRAY = []
LIGHT_ARRAY = []
CAR_ARRAY = []
currentChart = null

//MOUSE POSITION INITS
initialMouseX = 0
initialMouseY = 0
mouseX = 0
mouseY = 0

//CONSTANT INITS
var instructionDiv = document.getElementsByClassName("instructions")[0];
universalSpeedMultiplier = 5
universalSpeedText = "1x"
lightCycle = 300
universalCarVelocity = 20 //METERS PER SECOND OR WHATEVER
currentCarScore = 0
universalLinearEpsilonReduction = 0.001


//FUNCTIONS UNDER CONSTRUCTION
function randomizeLightTiming(){
    //ASSIGNS ALL LIGHTS IN LIGHT ARRAY RANDOM TIMING FUNCTION
    if(LIGHT_ARRAY.length > 0){
        for(let i = 0; i<LIGHT_ARRAY.length; i++){
            randomSeed = Math.random(100)
            if(randomSeed == 0){
                randomSeed = 1
            }
            newTime = (1/randomSeed)
            LIGHT_ARRAY[i].timeGreen = newTime
        }
    }
}
function findBestLightTimes(){
    //RETURNS ARRAY OF LIGHT TIMES CORRESPONDING WITH CURRENT LIGHT ARRAY
}
function getCurrentModelScore(interval){
    
    //RETURNS AMOUNT OF CARS THAT CAN PASS THROUGH THE CURRENT SYSTEM IN A GIVEN TIME
    currentModelScore = 0
    for(let j = 0; j<LIGHT_ARRAY.length; j++){
        LIGHT_ARRAY[j].determineRoads()
    }
    for(let i = 0; i<ROAD_ARRAY.length; i++){
        //CALCULATE AMOUNT OF CARS THAT PASS THROUGH EACH ROAD ON TIME INTERVAL
        totalStoppedInterval = 0
        for(let z = 0; z<LIGHT_ARRAY.length; z++){
            if(LIGHT_ARRAY[z].redRoad == ROAD_ARRAY[i]){
                totalStoppedInterval += (lightCycle - (LIGHT_ARRAY[z].timeGreen*lightCycle))
            }
            else if(LIGHT_ARRAY[z].greenRoad == ROAD_ARRAY[i]){
                totalStoppedInterval += (LIGHT_ARRAY[z].timeGreen*lightCycle)
            }
            roadLength = Math.abs(getDistance(ROAD_ARRAY[i].startX, ROAD_ARRAY[i].startY, ROAD_ARRAY[i].endX, ROAD_ARRAY[i].endY))
            timeTakenByCar = roadLength/universalCarVelocity+totalStoppedInterval
            currentModelScore += (interval/timeTakenByCar)
            //console.log("CURRENTMODELSCORE:")
            //console.log(currentModelScore)
        }
    }
    if(currentModelScore < 0){
        currentModelScore = 0
    }
    //CLAUSE THAT DIVIDES MODEL SCORE BY LENGTH TO MAKE METRIC MORE STANDARDIZED
    currentModelScore = currentModelScore/ROAD_ARRAY.length
    if(GRAPHVALUES[GRAPHVALUES.length-1] != currentModelScore){
        GRAPHVALUES.push(currentModelScore)
    }
    //console.log(GRAPHVALUES)
    return currentModelScore
}
function getCarSpawnFrequency(road){
    //RETURNS CAR SPAWN FREQUENCY COEFFICIENT BASED ON ROAD LENGTH FOR CAR SPAWNING FUNCTION IN ROAD CLASS
}

//ANYTHING NEURAL RELATED GOES HERE
function adjustEpsilon(predictedQ, actualQ){
    let returnVal = 0
    let bigger = 0
    let smaller = 0
    let sign = 1
    if(predictedQ > actualQ){
        bigger = predictedQ
        smaller = actualQ
        sign = -1
    }
    else if(actualQ>predictedQ){
        bigger = actualQ
        smaller = predictedQ
    }
    if((smaller/bigger)<(0.85)){
        returnVal += 5 * universalLinearEpsilonReduction
    }
    if((smaller/bigger)<(0.55)){
        returnVal += 10 * universalLinearEpsilonReduction
    }
    if((smaller/bigger)<(0.25)){
        returnVal += 10* universalLinearEpsilonReduction
    }
    return returnVal
    //return number for epsilon adjustment
}
function getLightTimeArray(){
    returnVal = []
    for(let i = 0; i<LIGHT_ARRAY.length; i++){
        returnVal.push(LIGHT_ARRAY[i].getLightTime())
    }
    return returnVal
}
function toggleNetRunning(){
    if(netRunning == true){
        netRunning = false
    }
    else{
        netRunning = true
    }
}
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}
function getRandomLightChange(){
    returnVal = 0
    inter = getRandomInt(0, 4)
    if(inter == 0){
        returnVal=(-0.2)
    }
    else if(inter == 1){
        returnVal=(0.2)
    }
    else if(inter == 2){
        returnVal=(-0.4)
    }
    else if(inter == 3){
        returnVal=(0.4)
    }
    return returnVal
}

class QTABLE{
    constructor(initialStates, initialActions, initialQs){
        this.states = initialStates
        this.actions = initialActions
        this.qVals = initialQs
        this.epsilon = 1
        this.episodes = 0
        this.linearEpsilonReduction = universalLinearEpsilonReduction
    }
    getDifferenceTable(){
        //returns table with similarity values for all current states in q table with lightarray
        let returnArray = []
        for(let i = 0; i<this.states.length; i++){
            let differenceScore = 0
            let count = 0
            for(let x = 0; x<this.states[i].length; x++){
                differenceScore = differenceScore + Math.abs(getLightTimeArray()[x]-this.states[i][x])
                count = count + 1
            }
            differenceScore = differenceScore/count
            returnArray.push(differenceScore)
        }
        
        return returnArray
    }
    runQOptimize(){
        
        if(Math.random()>this.epsilon){
            //EXPLOIT
            if(this.qVals != []){
                let testSeed = Math.random()
                
                    //FIND SIMILAR STATES TO CURRENT STATE, WITH THOSE FIND HIGHEST Q VALUE
                //MAX IS THE INDEX OF THE HIGHEST Q VALUE
                var differenceTable = this.getDifferenceTable()
                //console.log(differenceTable)
                //console.log(getLightTimeArray())
                let total = 0
                let count = 0
                let tableLowest = 10000
                for(let i = 0; i<differenceTable.length; i++){
                    total = total + differenceTable[i]
                    count = count + 1
                    if(differenceTable[i] < tableLowest){
                        tableLowest = differenceTable[i]
                    }
                }
                let tableAverage = total/count
                let iTable = []
                for(let i = 0; i<differenceTable.length; i++){
                    if(differenceTable[i] < ((tableAverage+tableLowest)/2)){
                        iTable.push(i)
                    }
                }
                //NOW FIND HIGHEST Q VALUE IN I TABLE (WHICH CONTAINS ALL STATES ABOVE AVERAGE SIMILARITY)
                let index = 0
                let max = 0
                for(let i = 0; i<iTable.length; i++){
                    if(this.qVals[iTable[i]] > max){
                        max = this.qVals[iTable[i]]
                        index = iTable[i]
                    }
                }
                
                let actionToTake = this.actions[index]
                
                //TAKE THE ACTION AND ADJUST THE Q SCORE BASED ON RESULT
                let currentScore = getCurrentModelScore(50)
                LIGHT_ARRAY[actionToTake[0]].setTimeGreen(LIGHT_ARRAY[actionToTake[0]].getLightTime() + actionToTake[1])


                //console.log("timegreenset")
                //console.log(LIGHT_ARRAY[actionToTake[0]].getLightTime())


                let qAdjust = (getCurrentModelScore(50) - currentScore)/2
                //FIND A BETTER Q METRIC ADJUST ALGO THAN LINE ABOVE

                this.qVals[index] += qAdjust
                if(this.epsilon > 0){
                    this.epsilon = this.epsilon + (adjustEpsilon(currentScore, getCurrentModelScore(50)))
                }
                else{
                    this.epsilon = 0
                }
                this.episodes = this.episodes + 1
                
            }
            console.log("epsilon")
            console.log(this.epsilon)
            for(let i = 0; i<this.qVals.length; i++){
                if(this.qVals[i] < 0){
                    this.qVals[i] = 0
                }
            }
        }
        else{
            //EXPLORE
            let index1 = getRandomInt(0, LIGHT_ARRAY.length)
            let change = getRandomLightChange()
            this.actions.push([index1, change])
            this.states.push(getLightTimeArray())
            let currentScore = getCurrentModelScore(50)
            LIGHT_ARRAY[index1].setTimeGreen(getLightTimeArray()[index1] + change)
            this.qVals.push(getCurrentModelScore(50))
            if(this.epsilon > 0){
                this.epsilon = this.epsilon -this.linearEpsilonReduction
            }
            else{
                this.epsilon = 0
            }
            
            this.episodes = this.episodes + 1
        }
        console.log("QTABLESIZE")
        console.log(this.qVals.length)
    }
}





//DYNAMIC CHART FUNCTIONS
function resetGraph(){
    GRAPHVALUES = []
}
function manageGraph(){  
        if(GRAPHVALUES.length > 20){
            even = false;
            newArray = []
            for(let i = 0; i<GRAPHVALUES.length; i++){
                if(even == true){
                    newArray.push(GRAPHVALUES[i])
                    even = false;
                }
                else{
                    even = true
                }
            }
            GRAPHVALUES = newArray
        }
}
function updateGraph(){
    if(currentChart != null){
        currentChart.destroy()
    }
    currentChart = new Chart("myChart", {
        type: "line",
        data: {
          labels: ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
          datasets: [{
            backgroundColor: "rgba(0,0,0,1.0)",
            borderColor: "rgba(15, 15, 15)",
            data: GRAPHVALUES,
            fill: false,
            borderColor: 'rgb(15, 15, 15, 0.3)',
            label: "QTable Performance",
            pointBackgroundColor: 'rgb(150, 126, 127)',
            pointBorderColor: 'rgb(150, 126, 127)',
          }]
        },
        options: {
            //POTENTIALLY REMOVE THIS BIT LATER ON TO SHOW SCALES< MORE SPECIFIC DATA
            //scales: {
            //    xAxes: [{
            //      display: false
            //    }],
            //    yAxes: [{
            //      display: false
            //    }],
            //},
            
            //scales: {
            //    yAxes: [{
            //        ticks: {
            //            //backdropColor : "rgba(255,255,255,0)",
            //            userCallback: function(value, index, values) {
            //              return "";
            //            }
            //          }
            //     }]
            //   },
            
            
           
            animation: {
                duration: 0
            },
            elements: {
                point:{
                    radius: 2
                }
            },
        }
      });
}

//HELPER FUNCTIONS
function getDistance(x1, y1, x2, y2){
    let y = x2 - x1;
    let x = y2 - y1;
    
    return Math.sqrt(x * x + y * y);
}
function intersects(a,b,c,d,p,q,r,s) {
    //GENIUS LITTLE ALGO FROM LAMBDA DETERM.
    var det, gamma, lambda;
    det = (c - a) * (s - q) - (r - p) * (d - b);
    if (det === 0) {
      return false;
    } else {
      lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
      gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
      return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
}
function toggleUniversalSpeed(){
    if(universalSpeedMultiplier == 1){
        universalSpeedMultiplier = 5
        lightCycle = 150
        universalSpeedText = "5x"
        document.getElementById("speedText").innerHTML = universalSpeedText;
    }
    else{
        universalSpeedMultiplier = 1
        lightCycle = 300
        universalSpeedText = "1x"
        document.getElementById("speedText").innerHTML = universalSpeedText;
    }
}
function toggleCarsMoving(){
    if(carsMoving == false){
        carsMoving = true
    }
    else{
        carsMoving = false
    }
}
function line_intersect(x1, y1, x2, y2, x3, y3, x4, y4)
{
    var ua, ub, denom = (y4 - y3)*(x2 - x1) - (x4 - x3)*(y2 - y1);
    if (denom == 0) {
        return null;
    }
    ua = ((x4 - x3)*(y1 - y3) - (y4 - y3)*(x1 - x3))/denom;
    ub = ((x2 - x1)*(y1 - y3) - (y2 - y1)*(x1 - x3))/denom;
    return {
        x: x1 + ua * (x2 - x1),
        y: y1 + ua * (y2 - y1),
        seg1: ua >= 0 && ua <= 1,
        seg2: ub >= 0 && ub <= 1
    };
}
function manageLineDrawing(){
    if(MOUSEDOWN == true){
        building = true
        c.beginPath();
        c.moveTo(initialMouseX, initialMouseY);
        c.lineWidth = 15;
        c.lineCap = 'square';
        c.lineTo(mouseX, mouseY);
        c.strokeStyle = "blue"
        c.globalAlpha = 0.3
        c.stroke();
        c.globalAlpha = 1
    }
    if(MOUSEDOWN == false && building == true){
        if(ROAD_ARRAY.length > 0){
            for(let i = 0; i<ROAD_ARRAY.length; i++){
                if(intersects(ROAD_ARRAY[i].startX, ROAD_ARRAY[i].startY, ROAD_ARRAY[i].endX, ROAD_ARRAY[i].endY, initialMouseX, initialMouseY, mouseX, mouseY) == true){
                    //console.log("intersection detected")
                    //console.log(line_intersect(ROAD_ARRAY[i].startX, ROAD_ARRAY[i].startY, ROAD_ARRAY[i].endX, ROAD_ARRAY[i].endY, initialMouseX, initialMouseY, mouseX, mouseY)['x'])
                    //console.log(line_intersect(ROAD_ARRAY[i].startX, ROAD_ARRAY[i].startY, ROAD_ARRAY[i].endX, ROAD_ARRAY[i].endY, initialMouseX, initialMouseY, mouseX, mouseY)['y'])
                    LIGHT_ARRAY.push(new Light(line_intersect(ROAD_ARRAY[i].startX, ROAD_ARRAY[i].startY, ROAD_ARRAY[i].endX, ROAD_ARRAY[i].endY, initialMouseX, initialMouseY, mouseX, mouseY)['x'], line_intersect(ROAD_ARRAY[i].startX, ROAD_ARRAY[i].startY, ROAD_ARRAY[i].endX, ROAD_ARRAY[i].endY, initialMouseX, initialMouseY, mouseX, mouseY)['y'], 'red', 15, 0.5))
                }
            }
        }
        ROAD_ARRAY.push(new Road(initialMouseX, initialMouseY, mouseX, mouseY, 15, "blue", false))
        building = false
    }
    //when you push to the array, check for intersections with other roads. IF ANY INTERSECTIONS FOUND CREATE STOPLIGHT NODE
}
function clearMap(){
    while(ROAD_ARRAY.length > 0){
        ROAD_ARRAY.pop()
    }
    while(LIGHT_ARRAY.length > 0){
        LIGHT_ARRAY.pop()
    }
    resetGraph()
    window.location.reload()
}
function update(){
    c.clearRect(0, 0, canvas.width, canvas.height)
    manageLineDrawing()
    manageGraph()
    updateGraph()
    for(let i = 0; i<ROAD_ARRAY.length; i++){
        ROAD_ARRAY[i].draw()
    }
    if(carsMoving == true){
        for(let i = 0; i<ROAD_ARRAY.length; i++){
            ROAD_ARRAY[i].updateCars()
        }
    }
    for(let i = 0; i<LIGHT_ARRAY.length; i++){
        LIGHT_ARRAY[i].animate()
    }
    if(gameRunning == false && MOUSEDOWN == true){
        gameRunning = true
        instructionDiv.style.display = "none";
    }
    if(netRunning == true && qChart == null){
        qChart = new QTABLE([], [], [])
    }
    if(netRunning == true && qChart != null){
        for(let i = 0; i<10; i++){
            qChart.runQOptimize()
        }
    }
    
    //LOGS CURRENT MODEL SCORE
    if(netRunning){
        getCurrentModelScore(50)
    }
    
    requestAnimationFrame(update)
}

//EVENT LISTENERS
canvas.addEventListener("mouseup", e => {
    MOUSEDOWN = false
})
canvas.addEventListener("mousedown", e => {
    //clicklistener for creating roads
    MOUSEDOWN = true
    initialMouseX = e.x
    initialMouseY = e.y
})
canvas.addEventListener("mousemove", function(e){
    mouseX = e.x
    mouseY = e.y
})

//CLASS DEFINITIONS
class Road{
    constructor(startX, startY, endX, endY,width, color, placed){
        this.carFreq = 2
        this.cars = []
        this.startX = startX
        this.startY = startY
        this.endX = endX
        this.endY = endY
        this.width = width
        this.color = color
        this.placed = placed
    }
    draw(){
        c.beginPath();
        c.moveTo(this.startX, this.startY);
        c.lineWidth = this.width + 2;
        c.lineCap = 'square';
        c.lineTo(this.endX, this.endY);
        c.strokeStyle = 'white'
        c.stroke();

        //STUFF ABOVE IS TEST WHITE LINE BACKGROUNDF FOR CITY MAP BACJKGRTOUND
        c.beginPath();
        c.moveTo(this.startX, this.startY);
        c.lineWidth = this.width;
        c.lineCap = 'square';
        c.lineTo(this.endX, this.endY);
        c.strokeStyle = this.color
        c.globalAlpha = 0.3
        c.stroke();
        c.globalAlpha = 1
        //couldnt find better way to change opacity without global alpha shift to 0.2 and then back to normal. REVISE THIS WHEN SOLUTION FOUND
        
    } 
    updateCars(){
        let rand = Math.floor(Math.random() * 101);
        if(rand<this.carFreq && this.cars.length < 12){
            this.cars.push(new Car(this.startX, this.startY, 'blue', [(this.endX - this.startX), (this.endY - this.startY)], 6, this, true))
            //console.log((this.endX - this.startX))
            //console.log((this.endY - this.startY))
        }
        if(this.cars.length > 0){
            for(let i = 0; i<this.cars.length; i++){
                this.cars[i].animate()
            }
        }
        //add update and add cars method
    }
}
class Light{
    constructor(x, y, color, radius, timeGreen){
        this.x = x
        this.y = y
        this.color = color
        this.radius = radius
        this.greenRoad = null
        this.redRoad = null
        this.timeGreen = timeGreen
        this.timeRed = STOPLIGHTCYCLETIME - this.timeGreen
        this.tick = 0
    }
    getLightTime(){
        return this.timeGreen
    }
    determineRoads(){
        for(let i = 0; i<ROAD_ARRAY.length; i++){
            //DETERMINE WHICH TWO ROADS THIS LIGHT LIES ON AND PASS THEM RANDOMLY TO THE GREENROAD AND REDROAD CONTAINERS
            if(Math.abs((getDistance(ROAD_ARRAY[i].startX, ROAD_ARRAY[i].startY, this.x, this.y)+getDistance(this.x, this.y, ROAD_ARRAY[i].endX, ROAD_ARRAY[i].endY))-(getDistance(ROAD_ARRAY[i].startX, ROAD_ARRAY[i].startY, ROAD_ARRAY[i].endX, ROAD_ARRAY[i].endY)))<=20){
                if(this.greenRoad == null){
                    this.greenRoad = ROAD_ARRAY[i]
                }
                else if(this.redRoad == null){
                    this.redRoad = ROAD_ARRAY[i]
                }
                //else{
                //  console.log("BOTH ROAD SLOTS FULL : REVISE ABSOLUTE VALUE DOMAIN IN CONDITION")
                //}
            }
        }
    }
    setTimeGreen(time){
        this.timeGreen = time
        this.timeRed = STOPLIGHTCYCLETIME - this.timeGreen
    }
    draw(){
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        c.fillStyle = 'black'
        c.fill()
        c.beginPath();
        c.arc(this.x, this.y, this.radius*0.7, 0, 2 * Math.PI);
        c.fillStyle = this.color
        c.fill()
    }
    animate(){
        if(Math.abs(this.tick - this.timeGreen*lightCycle)<20){
            this.color = 'red'
        }
        if(Math.abs(this.tick - lightCycle) < 20){
            this.color = 'green'
            this.tick = 0
        }
        this.tick += 1
        this.draw()
    }
}
class Car{
    constructor(x, y, color, slope, width, road, isMoving){
        this.velocity = 0.5
        this.isMoving = isMoving;
        this.origin = [x, y]
        this.x = x
        this.y = y
        this.color = color
        this.slope = slope
        this.width = width
        this.road = road
    }
    
    draw(){
        c.beginPath();
        c.moveTo(this.x, this.y);
        c.lineWidth = this.width;
        c.lineCap = 'square';
        c.lineTo(this.slope[0]/Math.sqrt((this.slope[0]*this.slope[0])+(this.slope[1]*this.slope[1]))*10+this.x, this.slope[1]/Math.sqrt((this.slope[0]*this.slope[0])+(this.slope[1]*this.slope[1]))*10+this.y);
        c.strokeStyle = this.color
        c.globalAlpha = 0.6
        c.stroke();
        c.globalAlpha = 1
        //couldnt find better way to change opacity without global alpha shift to 0.2 and then back to normal. REVISE THIS WHEN SOLUTION FOUND
    }
    toggleMove(){
        if(this.isMoving == true){
            this.isMoving = false
        }
        else{
            this.isMoving = true
        }
    }
    animate(){
        if(this.isMoving == true){
            if(Math.abs(this.x-this.road.endX) < 6 && Math.abs(this.y-this.road.endY)<6){
                this.x = this.origin[0]
                this.y = this.origin[1]
            }
            else{
                let normalizedX = this.slope[0]/Math.sqrt((this.slope[0]*this.slope[0])+(this.slope[1]*this.slope[1]))*3
                let normalizedY = this.slope[1]/Math.sqrt((this.slope[0]*this.slope[0])+(this.slope[1]*this.slope[1]))*3

                this.x += this.velocity*(normalizedX)*universalSpeedMultiplier
                this.y += this.velocity*(normalizedY)*universalSpeedMultiplier
                
                
                //THIS BIT NEEDS REVISION
                
                //console.log(this.slope[1])
                //console.log(this.slope[0])
                //console.log(normalizedY)
                //console.log(normalizedX)
            }
        }
        this.draw()
    }
}

//MAIN RUN CODE

update()



