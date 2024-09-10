const canvas = document.getElementById('floorplan-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 1200;
canvas.height = 800;

const tooltip = document.getElementById('tooltip');
const saveButton = document.getElementById('save-button');
const loadButton = document.getElementById('load-button');

let data = {
    "Regions": [
        // Outer walls
        [{ "X": 100, "Y": 100, "Z": 52 }, { "X": 1100, "Y": 100, "Z": 52 }],
        [{ "X": 1100, "Y": 100, "Z": 52 }, { "X": 1100, "Y": 700, "Z": 52 }],
        [{ "X": 1100, "Y": 700, "Z": 52 }, { "X": 100, "Y": 700, "Z": 52 }],
        [{ "X": 100, "Y": 700, "Z": 52 }, { "X": 100, "Y": 100, "Z": 52 }],
        // Interior walls
        [{ "X": 300, "Y": 100, "Z": 52 }, { "X": 300, "Y": 400, "Z": 52 }],
        [{ "X": 300, "Y": 400, "Z": 52 }, { "X": 800, "Y": 400, "Z": 52 }],
        [{ "X": 800, "Y": 400, "Z": 52 }, { "X": 800, "Y": 100, "Z": 52 }],
        [{ "X": 800, "Y": 400, "Z": 52 }, { "X": 800, "Y": 700, "Z": 52 }],
        [{ "X": 500, "Y": 400, "Z": 52 }, { "X": 500, "Y": 700, "Z": 52 }]
    ],
    "Doors": [
        { "Location": { "X": 600, "Y": 100, "Z": 52 }, "Rotation": 0, "Width": 50 },
        { "Location": { "X": 300, "Y": 250, "Z": 52 }, "Rotation": Math.PI / 2, "Width": 40 },
        { "Location": { "X": 800, "Y": 250, "Z": 52 }, "Rotation": Math.PI / 2, "Width": 40 },
        { "Location": { "X": 500, "Y": 550, "Z": 52 }, "Rotation": Math.PI / 2, "Width": 40 },
        { "Location": { "X": 950, "Y": 700, "Z": 52 }, "Rotation": Math.PI, "Width": 60 }
    ],
    "Furnitures": [
        {
            "MinBound": { "X": -20, "Y": -40, "Z": 0 },
            "MaxBound": { "X": 20, "Y": 40, "Z": 3 },
            "equipName": "Sofa",
            "xPlacement": 400,
            "yPlacement": 300,
            "rotation": 0
        },
        {
            "MinBound": { "X": -15, "Y": -15, "Z": 0 },
            "MaxBound": { "X": 15, "Y": 15, "Z": 7 },
            "equipName": "Dining Table",
            "xPlacement": 800,
            "yPlacement": 500,
            "rotation": Math.PI / 4
        },
        {
            "MinBound": { "X": -10, "Y": -10, "Z": 0 },
            "MaxBound": { "X": 10, "Y": 10, "Z": 5 },
            "equipName": "Chair",
            "xPlacement": 750,
            "yPlacement": 450,
            "rotation": Math.PI / 2
        },
        {
            "MinBound": { "X": -25, "Y": -10, "Z": 0 },
            "MaxBound": { "X": 25, "Y": 10, "Z": 4 },
            "equipName": "Bed",
            "xPlacement": 300,
            "yPlacement": 600,
            "rotation": 0
        }
    ]
};

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let startX, startY;

canvas.addEventListener('wheel', handleZoom);
canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', endDrag);
canvas.addEventListener('mouseleave', endDrag);

saveButton.addEventListener('click', saveLayout);
loadButton.addEventListener('click', loadLayout);

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    drawGrid();
    drawRegions(data.Regions);
    drawDoors(data.Doors);
    drawFurnitures(data.Furnitures);

    ctx.restore();
}

function drawGrid() {
    ctx.strokeStyle = '#d3d3d3';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawRegions(regions) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 5;
    regions.forEach(([start, end]) => {
        ctx.beginPath();
        ctx.moveTo(start.X, start.Y);
        ctx.lineTo(end.X, end.Y);
        ctx.stroke();
    });
}

function drawDoors(doors) {
    ctx.fillStyle = '#A0522D';
    doors.forEach(door => {
        const { Location, Width, Rotation } = door;
        ctx.save();
        ctx.translate(Location.X, Location.Y);
        ctx.rotate(Rotation);
        ctx.fillRect(-Width / 2, -5, Width, 10);
        ctx.restore();
    });
}

function drawFurnitures(furnitures) {
    furnitures.forEach(furniture => {
        const { MinBound, MaxBound, xPlacement, yPlacement, equipName, rotation } = furniture;
        const width = MaxBound.X - MinBound.X;
        const height = MaxBound.Y - MinBound.Y;

        ctx.save();
        ctx.translate(xPlacement, yPlacement);
        ctx.rotate(rotation);
        ctx.fillStyle = equipName === 'Sofa' ? '#8b4513' :
                        equipName === 'Dining Table' ? '#2f4f4f' :
                        equipName === 'Chair' ? '#708090' :
                        '#cd853f'; // Color per item
        ctx.fillRect(MinBound.X, MinBound.Y, width, height);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.restore();
    });
}

function handleZoom(e) {
    e.preventDefault();
    const zoomFactor = 1.1;
    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = Math.pow(zoomFactor, direction);

    const mouseX = e.offsetX;
    const mouseY = e.offsetY;
    offsetX = mouseX - (mouseX - offsetX) * factor;
    offsetY = mouseY - (mouseY - offsetY) * factor;
    scale *= factor;

    draw();
}

function startDrag(e) {
    isDragging = true;
    startX = e.offsetX - offsetX;
    startY = e.offsetY - offsetY;
}

function handleMouseMove(e) {
    if (isDragging) {
        offsetX = e.offsetX - startX;
        offsetY = e.offsetY - startY;
        draw();
    }
    showTooltip(e);
}

function endDrag() {
    isDragging = false;
}

function showTooltip(e) {
    const mouseX = (e.offsetX - offsetX) / scale;
    const mouseY = (e.offsetY - offsetY) / scale;
    const furniture = data.Furnitures.find(f => {
        const { xPlacement, yPlacement, MinBound, MaxBound } = f;
        const width = MaxBound.X - MinBound.X;
        const height = MaxBound.Y - MinBound.Y;
        return mouseX > xPlacement + MinBound.X && mouseX < xPlacement + MinBound.X + width &&
               mouseY > yPlacement + MinBound.Y && mouseY < yPlacement + MinBound.Y + height;
    });

    if (furniture) {
        tooltip.style.visibility = 'visible';
        tooltip.style.left = `${e.pageX + 10}px`;
        tooltip.style.top = `${e.pageY + 10}px`;
        tooltip.textContent = furniture.equipName;
    } else {
        tooltip.style.visibility = 'hidden';
    }
}

function saveLayout() {
    localStorage.setItem('floorplanLayout', JSON.stringify(data));
    alert('Layout saved successfully!');
}

function loadLayout() {
    const savedData = localStorage.getItem('floorplanLayout');
    if (savedData) {
        data = JSON.parse(savedData);
        draw();
        alert('Layout loaded successfully!');
    } else {
        alert('No saved layout found.');
    }
}

draw();
