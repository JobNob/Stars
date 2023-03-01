var canvas,
    context,
    maxSpeed =              20000,          // Максимальная скорость, после которой скорость звезды мгновенно уменьшается
    starDense =             200,            // Плотность звёзд
    blackHoleDense =        100000,         // Плотность чёрных дыр
    neutronDense =          50000,          // Плотность нейтронных звёзд
    collapseStepsAmount =   40,             // Раз в сколько тиков коллапсирующая нейтронка будет испускать звёзды
    neutronCritMass =       20000,          // Порог минимальной массы, после которой нейтронная звезда перестаёт коллапсировать
    neutronAddSize =        5;              // Во сколько раз коллапсирующая нейтронка будет больше,
                                            // адекватное поведение только в интервале 3-12

document.addEventListener("DOMContentLoaded", main, true);
document.addEventListener("mouseup", onmouseup, true);

var star = new Array(); // в этом массиве будут храниться все объекты
var count = 500; // начальное количество объектов
var HEIGHT = window.innerHeight, WIDTH = window.innerWidth;
var timer;

var G = 500; // задаём константу методом подбора
var dt = 0.001; // шаг вычисления

function GetRad(mass, dense){
    return Math.cbrt((mass/dense)*1000 / (4 * 3.1415));
}

function StarRand(){
    if(Math.random() < 0.001){
        return Math.random()*1000000;
    }
    if(Math.random() < 0.003){
        return Math.random()*100000;
    }
    if(Math.random() < 0.01){
        return Math.random()*1000;
    }
    if(Math.random() < 0.1){
        return Math.random()*100;
    }
    if(Math.random() < 0.5){
        return Math.random()*10;
    }
    return Math.random()*5;
}

function StarLittleRand(){
    if(Math.random() < 0.01){
        return Math.random()*50;
    }
    if(Math.random() < 0.1){
        return Math.random()*30;
    }
    if(Math.random() < 0.5){
        return Math.random()*10;
    }
    return Math.random()*5;
}

function StarMouseRand(){
    if(Math.random() < 0.1){
        return Math.random()*10000;
    }
    if(Math.random() < 0.7){
        return Math.random()*1000;
    }

    return Math.random()*1000;
}

function Shrink(prevSize, reqSize){
    if (prevSize > reqSize) {
        return prevSize - 0.1/Math.pow(Math.abs(prevSize-reqSize), 8/5);
    }
    else
        return reqSize;
}

function neutronShrink(star){
    if (star.isCollapsing == 1) {
        return GetRad(star.m, neutronDense)*neutronAddSize;
    }
    return Shrink(star.r, GetRad(star.m, neutronDense))
}

function onmouseup(/*MouseEvent*/ e){
    var aStar = new Star(1, 0);
    aStar.x = e.clientX;
    aStar.y = e.clientY;
    star.push(aStar);
    document.title = star.length;
}

function main(){
    // создаём холст на весь экран и прикрепляем его на страницу
    canvas = document.createElement('canvas');
    canvas.height = HEIGHT;
    canvas.width = WIDTH;
    canvas.id = 'canvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    document.body.appendChild(canvas);
    context = canvas.getContext("2d");

    var aStar;
    for(var i = 0; i < count; i++){
        aStar = new Star(0, 0);
        aStar.x = Math.random() * WIDTH;
        aStar.y = Math.random() * HEIGHT;
        star.push(aStar);
    }
    aStar.x = Math.random() * WIDTH;
    aStar.y = Math.random() * HEIGHT;
    star.push(aStar);

    // запуск таймер, ваш кэп ;-)
    timer = setInterval(Step, 20);
}

function Star(isMouse, isNew){
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    if (isMouse == 1)
        this.m = StarMouseRand()*100;
    else if (isNew == 1)
        this.m = StarLittleRand()*100;
    else
        this.m = StarRand();
    this.r = GetRad(this.m, starDense); // Radius
    this.isBH = 0;
    this.isN = 0;
    this.isInside;
    this.isCollapsing = 0;
    this.CollapsingStep = 0;
}

function Step(){
    var a, ax, ay, dx, dy, r;

    // важно провести вычисление каждый с каждым
    for(var i = 0; i < star.length; i++) // считаем текущий
        for(var j = 0; j < star.length; j++) // считаем второй
        {
            if(i == j || star[i] == null || star[j] == null) continue;
            // if(star[i].r == null || star[j].r == null) continue;
            dx = star[j].x - star[i].x;
            dy = star[j].y - star[i].y;

            r = dx * dx + dy * dy;// тут R^2
            if(r < 1) {
                r = 1;
            }

            // Создание нейтронных звёзд и чёрных дыр
            if (star[i].m > 100000 && star[i].isN == 0 && star[i].isCollapsing == 0) {
                star[i].isCollapsing = 1;
                console.log("Collapsing begins");
            }
            else if (star[i].m > 10000 && star[i].isCollapsing == 0 && star[i].isN == 0) {
                star[i].isBH = 1;
            }

            // По умолчанию 0
            star[i].isInside = 0;

            // Поглощение с перерассчётом массы
            if ((star[i].m-star[j].m) >= 0) { // Если текущая звезда тяжелее
                if ((Math.sqrt(r) <= star[i].r / 2) || (Math.sqrt(r) <= star[j].r / 2)) { // Если звезда j находится внутри i или наоборот
                    if (star[j].m > 100) { // Если можно отъесть сразу 100
                        star[i].m += star[j].m/7;
                        star[j].m -= star[j].m/7;
                    } else { // Если массы меньше 100 - i сжирает j целиком
                        star[i].m += star[j].m;
                        star[i].vx = (star[i].vx * star[i].m + star[j].vx * star[j].m) / (star[i].m + star[j].m);
                        star[i].vy = (star[i].vy * star[i].m + star[j].vy * star[j].m) / (star[i].m + star[j].m);
                        star[j] = null;
                    }
                    if (star[i].isBH == 0 && star[i].isN == 0 && star[i].isCollapsing == 0)
                        star[i].r = GetRad(star[i].m, starDense);
                    if (star[j] != null)
                        star[j].r = GetRad(star[j].m, starDense);
                    continue;
                } else {
                    if (Math.sqrt(r) <= star[j].r+star[i].r) { // Если звезда i соприкасается со звездой j
                        if (star[j].m > 50) { // Если можно отъесть 50
                            star[i].m += star[j].m/20;
                            star[j].m -= star[j].m/20;
                        } else {
                            star[i].m += star[j].m;
                            star[i].vx = (star[i].vx * star[i].m + star[j].vx * star[j].m) / (star[i].m + star[j].m);
                            star[i].vy = (star[i].vy * star[i].m + star[j].vy * star[j].m) / (star[i].m + star[j].m);
                            star[j] = null;
                        }
                        if (star[i].isBH == 0 && star[i].isN == 0 && star[i].isCollapsing == 0)
                            star[i].r = GetRad(star[i].m, starDense);
                        if (star[j] != null)
                            star[j].r = GetRad(star[j].m, starDense);
                        continue;
                    }
                }
            } else { // Если текущая всё же легче
                if ((Math.sqrt(r) <= star[i].r / 2) || (Math.sqrt(r) <= star[j].r / 2))
                    star[i].isInside = 1;
            }

            // Чёрные дыры должны сжиматься
            if (star[i].isBH == 1)
                star[i].r = Shrink(star[i].r, GetRad(star[i].m, blackHoleDense));

            // Так же как и нейтронки
            if (star[i].isN == 1) {
                //star[i].r = neutronShrink(star[i].r, GetRad(star[i].m, neutronDense), star[i].m);
                //star[i].r = GetRad(star[i].m, neutronDense);
                star[i].r = neutronShrink(star[i]);
            }

            // Как только чёрная дыра становится слишком массивной, она коллапсирует и становится нейтронкой
            // Нахрен астрономию!
            if (star[i].isCollapsing == 1) {
                if ((star[i].m > neutronCritMass) && (star[i].CollapsingStep % collapseStepsAmount == 0)) {
                    var NewStar = new Star(0, 1);
                    var ang = 2 * 3.141596 * Math.random();

                    NewStar.x = Math.cos(ang) * star[i].r * (1 + 1.5/neutronAddSize) + Math.sign(Math.cos(ang)) * Math.random() * (1 + 2/neutronAddSize) + star[i].x;
                    NewStar.y = Math.sin(ang) * star[i].r * (1 + 1.5/neutronAddSize) + Math.sign(Math.sin(ang)) * Math.random() * (1 + 2/neutronAddSize) + star[i].y;

                    NewStar.vx = star[i].vx + (NewStar.x - star[i].x)*100;
                    NewStar.vy = star[i].vy + (NewStar.y - star[i].y)*100;

                    star[i].m -= NewStar.m;
                    star.push(NewStar);
                    document.title = star.length;
                }
                else if ((star[i].m < neutronCritMass)){
                    star[i].isBH = 0;
                    star[i].isCollapsing = 0;
                    star[i].isN = 1;
                    console.log("Collapsing done");
                }
                //star[i].r = neutronShrink(star[i].r, GetRad(star[i].m, neutronDense), star[i].m);
                //star[i].r = GetRad(star[i].m, neutronDense);
                star[i].r = neutronShrink(star[i]);
                star[i].CollapsingStep += 1;
            }

            if (star[j] != null) {
                a = G * star[j].m / r;

                r = Math.sqrt(r); // тут R
                ax = a * dx / r; // a * cos
                ay = a * dy / r; // a * sin
                if (star[i].isInside == 0){
                    star[i].vx += ax * dt;
                    star[i].vy += ay * dt;
                }
                else { // Если звёзда находится внутри другой звёзды её скорость быстро уменьшается
                    star[i].vx = star[i].vx / 20 + ax * dt;
                    star[i].vy = star[i].vy / 20 + ay * dt;
                }
                if (Math.abs(star[i].vx) >= maxSpeed) star[i].vx = star[i].vx/1.2;
                if (Math.abs(star[i].vy) >= maxSpeed) star[i].vy = star[i].vx/1.2;
            }
        }

    // координаты меняем позже, потому что они влияют на вычисление ускорения
    for(var i = 0; i < star.length; i++){
        if (star[i] != null) {
            star[i].x += star[i].vx * dt;
            star[i].y += star[i].vy * dt;
            if (Math.abs(star[i].x) > Math.abs(WIDTH + star[i].r)){
                star[i].x = -star[i].x;
            }
            if (Math.abs(star[i].y) > Math.abs(HEIGHT + star[i].r)){
                star[i].y = -star[i].y;
            }
        }
    }

    // выводим на экран
    Draw();
}

function Draw(){
    // очищение экрана
    context.fillStyle = "#000000";
    context.fillRect(0, 0, WIDTH, HEIGHT);

    // отрисовка звёзд
    for(var i = 0; i < star.length; i++){
        if (star[i] != null) {
            context.fillStyle = "#ffffff";
            if (star[i].isBH == 1) {
                context.fillStyle = "#000000";
            }
            else if (star[i].isN == 1 || star[i].isCollapsing == 1) {
                context.fillStyle = "#57e7ed";
            }
            else {
                context.fillStyle = "#ffffff";
            }

            context.beginPath();
            context.arc(
                star[i].x,
                star[i].y,
                star[i].r,
                0,
                Math.PI * 2
            );
            context.closePath();
            context.fill();
        }
    }

}