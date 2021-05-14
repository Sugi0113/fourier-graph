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
let first = true, noChange = false, noChangeData = false, noChangeN = false, sabun=false, N, oldN = 0, A, B, C, F, dx, l, useFukuso, arr=[], arrA=[], arrB=[], ctx, zoom={x:1, y:1}, center={x:0, y:0}, warn='', time;
const PI = Math.PI, sin = Math.sin, cos = Math.cos, exp = Math.exp, pow = Math.pow, abs = Math.abs, W=1400, H=1400;
function log(...a){
    console.log(...a);
    return a;
}
function expComp(c){
    let r = exp(c.a);
    return new Complex(r*cos(c.b), r*sin(c.b));
}
function status(text, err, warn){
    let tgt = document.getElementById('status');
    if(err) tgt.className += 'err';
    else if(warn) tgt.className += 'warn';
    else tgt.className = '';
    tgt.innerHTML = text;
}
function calcArr(){
return new Promise((resolve, reject)=>{
    //計算途中で計算が再スタートされた場合に検知して現在の計算を止めるために、開始時点でのtimeを保存しておく
    const time2 = time;
    if(N<oldN/2){
        oldN = 0;
        arr = [];
        sabun = false;
    }
    let increase = oldN<N;
    let x=-l;
    void function loop(){try{
        if(time !== time2) return;
        let i=0;
        if(!sabun){
            status(`計算中です (n=0)`);
            for(let y=A(0)/2; x<=l+dx&&i<100; x+=dx, i++)
                arr.push(y);
            if(x<=l+dx) setTimeout(loop, 1);
        }
        if(x>l+dx || sabun) {
            sabun = false;
            void function loop2(n){try{
                if(time !== time2) return;
                if(n>N ^ !increase) return resolve();
                status(`計算中です (n=${n})`);
                const a = A(n), b = B(n);
                let x=-l, i=0;
                void function loop3(){try{
                    if(time !== time2) return;
                    let i2=0;
                    for(; i<arr.length && i2<100; x+=dx, i++, i2++)
                        arr[i] += (increase?1:-1)*(a*cos(n*PI*x/l) + b*sin(n*PI*x/l));
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
    const time2 = time;
    if(N<oldN/2){
        oldN = 0;
        arr = [];
        sabun = false;
    }
    let increase = oldN<N;
    let x=-PI;
    void function loop(){try{
        if(time !== time2) return;
        let i=0;
        if(!sabun){
            status(`計算中です (n=0)`);
            const y=C(0);
            for(; x<=l+dx&&i<100; x+=dx, i++){
                arrA.push(y.a);
                arrB.push(y.b);
            }
            if(x<=l+dx) setTimeout(loop, 1);
        }
        if(x>l+dx || sabun) {
            sabun = false;
            void function loop2(n){try{
                if(time !== time2) return;
                if(n>N ^ !increase) return resolve();
                status(`計算中です (n=±${n})`);
                const cPlus = C(n), cMinus = C(-n);
                let errMin = 0, errMax = 0;//虚部の値の、各nごとの最大値・最小値
                let x=-l, i=0;
                void function loop3(){try{
                    if(time !== time2) return;
                    for(let i2=0; i<arrA.length && i2<100; x+=dx, i++, i2++){
                        let y1 = cPlus.multiple(expComp(new Complex(0, n*PI*x/l))), y2 = cMinus.multiple(expComp(new Complex(0, -n*PI*x/l)));
                        arrA[i] += (increase?1:-1)*(y1.a + y2.a);
                        arrB[i] += (increase?1:-1)*(y1.b + y2.b);
                        errMax = Math.max(errMax, y1.b+y2.b); errMin = Math.min(errMin, y1.b+y2.b);
                    }
                    if(i<arrA.length) setTimeout(loop3, 1);
                    else{
                        //各nごとに、虚部の絶対値が一定値を超えた場合は警告
                        //数学的にいえば0以外だが、計算誤差があるため一定値までは許容
                        if(Math.max(errMax, -errMin) > 1e-10){
                            if(warn.match(/<br>/g) && warn.match(/<br>/g).length === 5){//3つのnまでは表示するが、それ以降の場合は追記しない
                                warn += '<br>(以下省略, 緑線が級数の虚部)';
                            }
                            if(!(warn.match(/<br>/g)) || warn.match(/<br>/g).length < 5){
                                if(warn.length) warn += '<br>';
                                warn += `n=${n}においてc<sub>n</sub>e<sup>inx</sup>+c<sub>-n</sub>e<sup>-inx</sup>の値が0になりませんでした<br>`+
                                        `最大値:${errMax} , 最小値:${errMin}`;
                            }
                        }
                        setTimeout(()=>loop2(n+(increase?1:-1)), 1);
                    }
                }catch(err){reject(err);}}();
            }catch(err){reject(err);}}(oldN+increase);
        }
    }catch(err){reject(err);}}();
});
}
function drawAxis(){
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, convertY(0));
    ctx.lineTo(W, convertY(0));
    ctx.stroke();//x軸を引く
    for(let x = Math.ceil(revertX(0)/l)*l; x<revertX(W); x += l){
        if(abs(x) < 1e-5) continue; //原点には描かない(足し算の計算誤差を想定して、===0とはしていない)
        //lの整数倍の箇所に目盛りをつける
        ctx.beginPath();
        ctx.moveTo(convertX(x), convertY(0)-W/100);
        ctx.lineTo(convertX(x), convertY(0)+W/100);
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(convertX(0), 0);
    ctx.lineTo(convertX(0), H);
    ctx.stroke();//y軸を引く
    for(let y = Math.ceil(revertY(H)/l)*l; y<revertY(0); y += l){
        if(abs(y) < 1e-5) continue;
        ctx.beginPath();
        ctx.moveTo(convertX(0)-W/100, convertY(y));
        ctx.lineTo(convertX(0)+W/100, convertY(y));
        ctx.stroke();
    }
}
function init(graphicOnly){
    let nArea = document.getElementById('N'), dxArea=document.getElementById('dx'), aArea = document.getElementById('a_n'), bArea = document.getElementById('b_n'), cArea = document.getElementById('c_n'), fArea = document.getElementById('f_x'), zoomXAarea = document.getElementById('zoomX'), zoomYAarea = document.getElementById('zoomY'), centerXAarea = document.getElementById('centerX'), centerYAarea = document.getElementById('centerY'), syukiArea = document.getElementById('syuki');
    useFukuso = document.getElementById('fukuso-check').checked;
    zoom.x = parseFloat(zoomXAarea.value);
    zoom.y = parseFloat(zoomYAarea.value);
    if(isNaN(zoom.x)||isNaN(zoom.y) || zoom.x <= 0 || zoom.y <= 0){status('ズーム倍率を正しく指定してください', true); return -1;}
    center.x = parseFloat(centerXAarea.value);
    center.y = parseFloat(centerYAarea.value);
    if(isNaN(center.x)||isNaN(center.y)){status('中心座標を正しく指定してください', true); return -1;}
    if(!first && noChangeData && noChangeN || graphicOnly) {
        return 1;
    } else if(noChangeData && !noChangeN){
        sabun = true;
    } else if(!noChangeData){
        dx = parseFloat(dxArea.value);
        if(isNaN(dx)){status('dxの値を正しく入力してください。', true); return -1;}
        if(dx <= 0){status('dxの値は0より大きい値で入力してください。', true); return -1;}
        l = eval(syukiArea.value)/2;
        if(isNaN(l)){status('周期を正しく入力してください。', true); return -1;}
        if(l <= 0){status('周期は0より大きい値で入力してください。', true); return -1;}
        oldN = 0;
        arr = [];
        arrA = [];
        arrB = [];
        sabun = false;
    }
    if(!noChangeN){
        N = parseInt(nArea.value);
        if(isNaN(N)){status('nの値を入力してください。'); return -1;}
        if(N<0){status('nの値は非負の整数を入力してください。'); return -1;}
    }
    nArea.value = N.toString();
    dxArea.value = dx.toString();
    if(!useFukuso){
        try{
            if(aArea.value.length) A = eval(`(()=> ${aArea.value})()`);
            else {status('a<sub>n</sub>の式を入力してください。', true); return -1;}
        }catch(err){
            status('a<sub>n</sub>の式の形式が正しくありません。', true); return -1;
        }
        try{
            if(!useFukuso && bArea.value.length) B = eval(`(()=> ${bArea.value})()`);
            else {status('b<sub>n</sub>の式を入力してください。', true); return -1;}
        }catch(err){
            status('b<sub>n</sub>の式の形式が正しくありません。', true); return -1;
        }
    } else {
        try{
            if(useFukuso && cArea.value.length) C = eval(`(()=> ${cArea.value})()`);
            else {status('c<sub>n</sub>の式を入力してください。', true); return -1;}
        }catch(err){
            status('c<sub>n</sub>の式の形式が正しくありません。', true); return -1;
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
    return W/2 + (x-center.x)/l/2*W*zoom.x;
}
function convertY(y){
    return H/2 - (y-center.y)/l/2*H*zoom.y;
}
function convert(x, y){
    return {x:convertX(x), y:convertY(y)};
}
function revertX(x){
    return center.x+(x-W/2)*2*l/zoom.x/W;
}
function revertY(y){
    return center.y+(H/2-y)*2*l/zoom.y/H;
}
function normalize(x){
    x = (x+l)%(2*l);
    if(x < 0) x += 2*l;
    return x-l;
}
function drawFunc(f){
    ctx.beginPath();
    let x = Math.floor(revertX(0)/dx)*dx;
    let r = revertX(W)+dx;
    ctx.moveTo(convertX(x), convertY(f(normalize(x))));
    let i=0;
    for(x+=dx; x<=r; x+=dx){
        ctx.lineTo(convertX(x), convertY(f(normalize(x))));
    }
    ctx.stroke();
}
function drawArr(arr){
    ctx.beginPath();
    let x = Math.floor(revertX(0)/dx)*dx;
    let r = revertX(W)+dx;
    ctx.moveTo(convertX(x), convertY(arr[Math.floor((normalize(x)+l)/dx)]));
    let i=0;
    for(x+=dx; x<=r; x+=dx){
        ctx.lineTo(convertX(x), convertY(arr[Math.floor((normalize(x)+l)/dx)]));
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
                    if(!warn.match(/\(以下省略, 緑線が級数の虚部\)$/)) warn += '<br>(緑線が級数の虚部)'
                    status(warn, false, true);
                }
                else if(useFukuso) status(`完了 (緑線が級数の虚部)<br>計算時間 : ${time}ms`);
                else status(`完了<br>計算時間 : ${time}ms`);
            }).catch(err => status(`下記のエラーが発生しました。<br>${err.stack}`, true));
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
                if(!warn.match(/\(以下省略, 緑線が級数の虚部\)$/)) warn += '<br>(緑線が級数の虚部)'
                status(warn, false, true);
            }
            else if(useFukuso) status(`完了 (緑線が級数の虚部)<br>計算時間 : ${time}ms`);
            else status(`完了<br>計算時間 : ${time}ms`);

        }
    }catch(err){
        status(`下記のエラーが発生しました。<br>${err.stack}`, true);
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
            if(useFukuso) status(`完了 (緑線が級数の虚部)<br>計算時間 : ${time}ms`);
            else status(`完了<br>計算時間 : ${time}ms`);
        }
    }catch(err){
        status(`下記のエラーが発生しました。<br>${err.stack}`, true);
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
        let el = document.getElementById('left');
        if(e.target.innerHTML === '表示'){
            e.target.innerHTML = '非表示';
            el.className = el.className.replace(' hide', '');
        } else {
            e.target.innerHTML = '表示';
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