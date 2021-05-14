'use strict';
class Complex{
    constructor(a, b){
        this.a = a;
        this.b = b;
    }
    get r(){
        return Math.hypot(this.a, this.b);
    }
    get arg(){
        return (Math.atan2(this.b, this.a)+2*PI)%(2*PI);
    }
    add(c){
        if(c.constructor !== Complex) return null;
        return new Complex(this.a+c.a, this.b+c.b);
    }
    sub(c){
        if(c.constructor !== Complex) return null;
        return new Complex(this.a-c.a, this.b-c.b);
    }
    multiple(c){
        if(c.constructor !== Complex) return null;
        const r = this.r*c.r, arg = this.arg+c.arg;
        return new Complex(r*Math.cos(arg), r*Math.sin(arg));
    }
    div(c){
        if(c.constructor !== Complex) return null;
        const r = this.r/c.r, arg = this.arg-c.arg;
        return new Complex(r*Math.cos(arg), r*Math.sin(arg));
    }
}
let first = true, noChange = false, noChangeData = false, noChangeN = false, sabun=false, N, oldN = 0, A, B, C, F, dx, useFukuso, arr=[], arrA=[], arrB=[], ctx, zoom={x:1, y:1}, center={x:0, y:0}, warn='', time;
const PI = Math.PI, sin = Math.sin, cos = Math.cos, exp = Math.exp, pow = Math.pow, abs = Math.abs, W=700, H=700;
function expComp(c){
    let r = exp(c.a);
    return new Complex(r*cos(c.b), r*sin(c.b));
}
function status(text, err, warn){
    let tgt = document.getElementById('status');
    if(err) tgt.className += 'err';
    else if(warn) tgt.className += 'warn';
    else tgt.className = '';
    tgt.innerText = text;
}
function A2(n){
    return C(n).add(C(-n)).a;
}
function B2(n){
    return -C(n).sub(C(-n)).b;
}
function calcArr(){
return new Promise((resolve, reject)=>{
    if(N<oldN/2){
        oldN = 0;
        arr = [];
        sabun = false;
    }
    let increase = oldN<N;
    let x=-PI;
    void function loop(){try{
        let i=0;
        if(!sabun){
            status(`計算中です (n=0)`);
            for(let y=A(0)/2; x<=PI+dx&&i<100; x+=dx, i++)
                arr.push(y);
            if(x<=PI+dx) setTimeout(loop, 1);
        }
        if(x>PI+dx || sabun) {
            sabun = false;
            void function loop2(n){try{
                if(n>N ^ !increase) return resolve();
                status(`計算中です (n=${n})`);
                const a = A(n), b = B(n);
                let x=-PI, i=0;
                void function loop3(){try{
                    let i2=0;
                    for(; i<arr.length && i2<100; x+=dx, i++, i2++)
                        arr[i] += (increase?1:-1)*(a*cos(n*x) + b*sin(n*x));
                    if(i<arr.length) setTimeout(loop3, 1);
                    else setTimeout(()=>loop2(n+(increase?1:-1)), 1);
                }catch(err){reject(err);}}();
            }catch(err){reject(err);}}(oldN+increase);
        }
    }catch(err){reject(err);}}();
});
}
function calcArrFukuso(){
return new Promise((resolve, reject)=>{
    if(N<oldN/2){
        oldN = 0;
        arr = [];
        sabun = false;
    }
    let increase = oldN<N;
    let x=-PI;
    void function loop(){try{
        let i=0;
        if(!sabun){
            status(`計算中です (n=0)`);
            const y=C(0);
            for(; x<=PI+dx&&i<100; x+=dx, i++){
                arrA.push(y.a);
                arrB.push(y.b);
            }
            if(x<=PI+dx) setTimeout(loop, 1);
        }
        if(x>PI+dx || sabun) {
            sabun = false;
            void function loop2(n){try{
                if(n>N ^ !increase) return resolve();
                status(`計算中です (n=±${n})`);
                const cPlus = C(n), cMinus = C(-n);
                let errMin = 0, errMax = 0;//虚部の値の、各nごとの最大値・最小値
                let x=-PI, i=0;
                void function loop3(){try{
                    for(let i2=0; i<arrA.length && i2<100; x+=dx, i++, i2++){
                        let y1 = cPlus.multiple(expComp(new Complex(0, n*x))), y2 = cMinus.multiple(expComp(new Complex(0, -n*x)));
                        arrA[i] += (increase?1:-1)*(y1.a + y2.a);
                        arrB[i] += (increase?1:-1)*(y1.b + y2.b);
                        errMax = Math.max(errMax, y1.b+y2.b); errMin = Math.min(errMin, y1.b+y2.b);
                    }
                    if(i<arrA.length) setTimeout(loop3, 1);
                    else setTimeout(()=>{
                        //各nごとに、虚部の絶対値が一定値を超えた場合は警告
                        //数学的にいえば0以外だが、計算誤差があるため一定値までは許容
                        if(Math.max(errMax, -errMin) > 1e-10){
                            if(warn.match(/\n/g) && warn.match(/\n/g).length === 5){//3つのnまでは表示するが、それ以降の場合は追記しない
                                warn += '\n(以下省略, 緑線が級数の虚部)';
                            }
                            if(!(warn.match(/\n/g)) || warn.match(/\n/g).length < 5){
                                if(warn.length) warn += '\n';
                                warn += `n=${n}においてc(n)*e^(inx)+c(-n)*e^(-inx)の値が0になりませんでした\n`+
                                        `最大値:${errMax} , 最小値:${errMin}`;
                            }
                        }
                        loop2(n+(increase?1:-1));
                    }, 1);
                }catch(err){reject(err);}}();
            }catch(err){reject(err);}}(oldN+increase);
        }
    }catch(err){reject(err);}}();
});
}
function drawAxis(){
    ctx.lineWitdh = 1;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    
    ctx.beginPath();
    ctx.moveTo(0, convertY(0));
    ctx.lineTo(W, convertY(0));
    ctx.stroke();//x軸を引く
    ctx.beginPath();
    ctx.moveTo(convertX(1), convertY(0)-H/100);
    ctx.lineTo(convertX(1), convertY(0)+H/100);
    ctx.stroke();//x軸の1の目盛りを引く
    ctx.beginPath();
    ctx.moveTo(convertX(-1), convertY(0)-H/100);
    ctx.lineTo(convertX(-1), convertY(0)+H/100);
    ctx.stroke();//x軸の-1の目盛りを引く
    if(convertX(PI)<=W){
        ctx.beginPath();
        ctx.moveTo(convertX(PI), convertY(0)-H/100);
        ctx.lineTo(convertX(PI), convertY(0)+H/100);
        ctx.stroke();//x軸のπの目盛りを引く
    }
    if(convertX(-PI)>=0){
        ctx.beginPath();
        ctx.moveTo(convertX(-PI), convertY(0)-H/100);
        ctx.lineTo(convertX(-PI), convertY(0)+H/100);
        ctx.stroke();//x軸の-πの目盛りを引く
    }

    ctx.beginPath();
    ctx.moveTo(convertX(0), 0);
    ctx.lineTo(convertX(0), H);
    ctx.stroke();//y軸を引く
    ctx.beginPath();
    ctx.moveTo(convertX(0)-W/100, convertY(1));
    ctx.lineTo(convertX(0)+W/100, convertY(1));
    ctx.stroke();//y軸の1の目盛りを引く
    ctx.beginPath();
    ctx.moveTo(convertX(0)-W/100, convertY(-1));
    ctx.lineTo(convertX(0)+W/100, convertY(-1));
    ctx.stroke();//y軸の-1の目盛りを引く
    if(convertY(PI)<=H){
        ctx.beginPath();
        ctx.moveTo(convertX(0)-W/100, convertY(PI));
        ctx.lineTo(convertX(0)+W/100, convertY(PI));
        ctx.stroke();//y軸のπの目盛りを引く
    }
    if(convertY(-PI)>=0){
        ctx.beginPath();
        ctx.moveTo(convertX(0)-W/100, convertY(-PI));
        ctx.lineTo(convertX(0)+W/100, convertY(-PI));
        ctx.stroke();//y軸の-πの目盛りを引く
    }
}
function init(graphicOnly){
    let nArea = document.getElementById('N'), dxArea=document.getElementById('dx'), aArea = document.getElementById('a_n'), bArea = document.getElementById('b_n'), cArea = document.getElementById('c_n'), fArea = document.getElementById('f_x'), zoomXAarea = document.getElementById('zoomX'), zoomYAarea = document.getElementById('zoomY'), centerXAarea = document.getElementById('centerX'), centerYAarea = document.getElementById('centerY');
    useFukuso = document.getElementById('fukuso-check').checked;
    dx = parseFloat(dxArea.value);
    zoom.x = parseFloat(zoomXAarea.value);
    zoom.y = parseFloat(zoomYAarea.value);
    center.x = parseFloat(centerXAarea.value);
    center.y = parseFloat(centerYAarea.value);
    if(isNaN(dx)){status('dxの値を入力してください。'); return -1;}
    if(dx <= 0){status('dxの値は0より大きい値で入力してください。'); return -1;}
    N = parseInt(nArea.value);
    if(!first && noChangeData && noChangeN || graphicOnly) {
        return 1;
    } else if(noChangeData && !noChangeN){
        sabun = true;
    } else if(!noChangeData){
        oldN = 0;
        arr = [];
        arrA = [];
        arrB = [];
        sabun = false;
    }
    if(isNaN(N)){status('nの値を入力してください。'); return -1;}
    nArea.value = N.toString();
    dxArea.value = dx.toString();
    if(!useFukuso){
        try{
            if(aArea.value.length) A = eval(`(()=> ${aArea.value})()`);
            else {status('a_nの式を入力してください。', true); return -1;}
        }catch(err){
            status('a_nの式の形式が正しくありません。', true); return -1;
        }
        try{
            if(!useFukuso && bArea.value.length) B = eval(`(()=> ${bArea.value})()`);
            else {status('b_nの式を入力してください。', true); return -1;}
        }catch(err){
            status('b_nの式の形式が正しくありません。', true); return -1;
        }
    } else {
        try{
            if(useFukuso && cArea.value.length) C = eval(`(()=> ${cArea.value})()`);
            else {status('c_nの式を入力してください。', true); return -1;}
        }catch(err){
            status('c_nの式の形式が正しくありません。', true); return -1;
        }
    }
    try{
        if(fArea.value.length) F = eval(`(()=> ${fArea.value})()`);
        else {status('f_xの式を入力してください。', true); return -1;}
    }catch(err){
        status('f_xの式の形式が正しくありません。', true); return -1;
    }
    ctx = document.getElementsByTagName('canvas')[0].getContext('2d');
    return 0;
}
function convertX(x){
    return W/2 + (x-center.x)/PI/2*W*zoom.x;
}
function convertY(y){
    return H/2 - (y-center.y)/PI/2*H*zoom.y;
}
function convert(x, y){
    return {x:convertX(x), y:convertY(y)};
}
function revertX(x){
    return center.x+(x-W/2)*2*PI/zoom.x/W;
}
function revertY(y){
    return center.y+(H/2-y)*2*PI/zoom.y/H;
}
function revert(x, y){
    return {x:revertX(x), y:revertY(y)};
}
function drawFunc(f){
    ctx.beginPath();
    let x2 = revertX(0);
    while(PI < x2) x2 -= 2*PI;
    while(x2 < -PI) x2 += 2*PI;
    ctx.moveTo(0, convertY(f(x2)));
    for(let x = 1; x<W; x++){
        x2 = revertX(x);
        while(PI < x2) x2 -= 2*PI;
        while(x2 < -PI) x2 += 2*PI;
        ctx.lineTo(x, convertY(f(x2)));
    }
    ctx.stroke();
}
function drawArr(arr){
    ctx.beginPath();
    let x2 = revertX(0);
    while(PI < x2) x2 -= 2*PI;
    while(x2 < -PI) x2 += 2*PI;
    let oldI = Math.floor((x2+PI)/dx), i;
    ctx.moveTo(0, convertY(arr[oldI]));
    for(let x = 1; x<W; x++){
        x2 = revertX(x);
        while(PI < x2) x2 -= 2*PI;
        while(x2 < -PI) x2 += 2*PI;
        i = Math.floor((x2+PI)/dx);
        if(i === oldI) continue;
        ctx.lineTo(x, convertY(arr[i]));
        oldI = i;
    }
    ctx.stroke();
}
function clearCanvas(){
    ctx.clearRect(0, 0, W, H);
}
function start(){
    warn = '';
    try{
        document.getElementById('redraw').disabled = false;
        if(noChange) return;
        status('初期化中です');
        switch(init()){
        case 0:
            clearCanvas();
            drawAxis();
            status('描画中です');
            ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
            drawFunc(F);
            time = Date.now();
            status('計算中です');
            ((useFukuso)?calcArrFukuso():calcArr()).then(()=>{
                time = Date.now() - time;
                first = false;
                oldN = N;
                noChange = true;
                noChangeData = true;
                sabun = true;
                status('描画中です');
                if(useFukuso){
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                    drawArr(arrA);
                    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
                    drawArr(arrB);
                }else{
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                    drawArr(arr);
                }
                if(warn.length){
                    if(!warn.match(/\(以下省略, 緑線が級数の虚部\)$/)) warn += '\n(緑線が級数の虚部)'
                    status(warn, false, true);
                }
                else if(useFukuso) status(`完了 (緑線が級数の虚部)\n計算時間 : ${time}ms`);
                else status(`完了\n計算時間 : ${time}ms`);
            }).catch(err => status(`下記のエラーが発生しました。\n${err.stack}`, true));
            break;
        case 1:
            clearCanvas();
            drawAxis();
            status('描画中です');
            ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
            drawFunc(F);
            if(useFukuso){
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                drawArr(arrA);
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
                drawArr(arrB);
            }else{
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                drawArr(arr);
            }
        case 2:
            if(warn.length){
                if(!warn.match(/\(以下省略, 緑線が級数の虚部\)$/)) warn += '\n(緑線が級数の虚部)'
                status(warn, false, true);
            }
            else if(useFukuso) status(`完了 (緑線が級数の虚部)\n計算時間 : ${time}ms`);
            else status(`完了\n計算時間 : ${time}ms`);

        }
    }catch(err){
        status(`下記のエラーが発生しました。\n${err.stack}`, true);
    }
}
function redraw(){
    try{
        if(noChange) return;
        status('初期化中です');
        switch(init(true)){
        case 0:
            status('バグった', true);
            break;
        case 1:
            clearCanvas();
            drawAxis();
            status('描画中です');
            ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
            drawFunc(F);
            if(useFukuso){
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                drawArr(arrA);
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
                drawArr(arrB);
            }else{
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                drawArr(arr);
            }
        case 2:
            if(useFukuso) status(`完了 (緑線が級数の虚部)\n計算時間 : ${time}ms`);
            else status(`完了\n計算時間 : ${time}ms`);
        }
    }catch(err){
        status(`下記のエラーが発生しました。\n${err.stack}`, true);
    }
}
document.addEventListener('DOMContentLoaded', ()=>{
    document.getElementsByTagName('canvas')[0].width = `${W}`;
    document.getElementsByTagName('canvas')[0].height = `${H}`;
    document.getElementById('start').addEventListener('click', start);
    document.getElementById('redraw').addEventListener('click', redraw);
    document.getElementById('fukuso-check').addEventListener('click', e => {
        const checked = e.target.checked;
        document.getElementById('a_n').disabled = checked;
        document.getElementById('b_n').disabled = checked;
        document.getElementById('c_n').disabled = !checked;
    });
    document.getElementById('hide-link').addEventListener('click', e => {
        if(e.target.innerHTML === '表示'){
            e.target.innerHTML = '非表示';
            for(const el of document.getElementsByClassName('input'))
                el.className = el.className.replace(' hide', '');
        } else {
            e.target.innerHTML = '表示';
            for(const el of document.getElementsByClassName('input'))
                el.className += ' hide';
        }
    });
    for(const el of document.querySelectorAll('input, textarea')){
        el.addEventListener('input', e=>{
            if(!e.target.id.match(/zoom|center/) && e.target.id !== 'N'){
                noChangeData = false;
            }
            else if(e.target.id === 'N'){
                noChangeN = false;
            }
            noChange = false;
        });
        el.addEventListener('keydown', e=>{
            if(e.key === 'Enter' && e.ctrlKey && !noChange){
                if(e.target.id.match(/zoom|center/) && noChangeData)
                    document.getElementById('redraw').click();
                else
                    document.getElementById('start').click();
            }
        });
        if(el.id === 'zoomX'){
            el.addEventListener('input', ()=>{
                if(document.getElementById('same-zoom-check').checked)document.getElementById('zoomY').value = el.value;
            });
        } else if(el.id === 'same-zoom-check'){
            el.addEventListener('input', ()=>{
                document.getElementById('zoomY').disabled = el.checked;
                if(el.checked) document.getElementById('zoomY').value = document.getElementById('zoomX').value;
            });
        }
    }
});