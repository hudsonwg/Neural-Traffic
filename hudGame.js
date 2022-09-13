const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
canvas.width = innerWidth
canvas.height = innerHeight
const STOPLIGHTCYCLETIME = 500
ROADPLACEMODE = true
var ROAD_ARRAY = []
LIGHT_ARRAY = []
CAR_ARRAY = []
MOUSEDOWN = false
initialMouseX = 0
initialMouseY = 0
mouseX = 0
mouseY = 0
building = false
universalSpeedMultiplier = 1
universalSpeedText = "1x"
var gameRunning = false
carsMoving = false
var instructionDiv = document.getElementsByClassName("instructions")[0];
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
        universalSpeedText = "5x"
        document.getElementById("speedText").innerHTML = universalSpeedText;
    }
    else{
        universalSpeedMultiplier = 1
        universalSpeedText = "1x"
        document.getElementById("speedText").innerHTML = universalSpeedText;
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
        this.timeGreen = timeGreen
        this.timeRed = STOPLIGHTCYCLETIME - this.timeGreen
        this.tick = 0
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
        if(this.tick == this.timeGreen){
            this.color = 'red'
        }
        if(this.tick == STOPLIGHTCYCLETIME){
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
        c.lineTo(((this.slope[0]/(this.slope[0]+this.slope[1]))*5)*2+this.x, ((this.slope[1]/(this.slope[0]+this.slope[1]))*5)*2+this.y);
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
                console.log("origin")
            }
            else{
                let normalC = [1, 1]
                let newX = this.slope[0]
                let newY = this.slope[1]
                if(newX < 0){
                    normalC[0] = -1
                    newX = newX * (-1)
                }
                if(newY < 0){
                    normalC[1] = -1
                    newY = newY * (-1)
                }
                let normalizedX = normalC[0]*((newX/(newX+newY))*5)
                let normalizedY = normalC[1]*((newY/(newX+newY))*5)

                this.x += this.velocity*(normalizedX)*universalSpeedMultiplier
                this.y += this.velocity*(normalizedY)*universalSpeedMultiplier
                
                
                //THIS BIT NEEDS REVISION
                
        
                console.log(normalizedY)
                console.log(normalizedX)
                console.log(normalC)
            }
        }
        this.draw()
    }
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
                    console.log("intersection detected")
                    console.log(line_intersect(ROAD_ARRAY[i].startX, ROAD_ARRAY[i].startY, ROAD_ARRAY[i].endX, ROAD_ARRAY[i].endY, initialMouseX, initialMouseY, mouseX, mouseY)['x'])
                    console.log(line_intersect(ROAD_ARRAY[i].startX, ROAD_ARRAY[i].startY, ROAD_ARRAY[i].endX, ROAD_ARRAY[i].endY, initialMouseX, initialMouseY, mouseX, mouseY)['y'])
                    LIGHT_ARRAY.push(new Light(line_intersect(ROAD_ARRAY[i].startX, ROAD_ARRAY[i].startY, ROAD_ARRAY[i].endX, ROAD_ARRAY[i].endY, initialMouseX, initialMouseY, mouseX, mouseY)['x'], line_intersect(ROAD_ARRAY[i].startX, ROAD_ARRAY[i].startY, ROAD_ARRAY[i].endX, ROAD_ARRAY[i].endY, initialMouseX, initialMouseY, mouseX, mouseY)['y'], 'red', 15, 300))
                }
            }
        }
        ROAD_ARRAY.push(new Road(initialMouseX, initialMouseY, mouseX, mouseY, 15, "blue", false))
        building = false
    }
    //when you push to the array, check for intersections with other roads. IF ANY INTERSECTIONS FOUND CREATE STOPLIGHT NODE
}
function toggleCarsMoving(){
    if(carsMoving == false){
        carsMoving = true
    }
    else{
        carsMoving = false
    }
}
function update(){
    c.clearRect(0, 0, canvas.width, canvas.height)
    manageLineDrawing()
    for(let i = 0; i<ROAD_ARRAY.length; i++){
        ROAD_ARRAY[i].draw()
    }
    if(carsMoving == true){
        for(let i = 0; i<ROAD_ARRAY.length; i++){
            console.log("ruinning")
            ROAD_ARRAY[i].updateCars()
        }
    }
    for(let i = 0; i<LIGHT_ARRAY.length; i++){
        LIGHT_ARRAY[i].animate()
    }
    
    if(gameRunning == false && MOUSEDOWN == true){
        gameRunning = true
        console.log("helo")
        instructionDiv.style.display = "none";
    }

    requestAnimationFrame(update)
}

//const someRoad = new Road(100, 100, 300, 400, 15, 'blue')
//const someCar = new Car(100, 100, 'purple', [2, 3], 20, someRoad, true)
//const someLight = new Light(300, 400, 'green', 12, 300)
update()


function clearMap(){
    while(ROAD_ARRAY.length > 0){
        ROAD_ARRAY.pop()
    }
    while(LIGHT_ARRAY.length > 0){
        LIGHT_ARRAY.pop()
    }
}


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

//console.log(c)
