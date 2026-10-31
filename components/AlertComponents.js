export function AlertMessage(message,redirection = null){
    const container = document.querySelector("body");
    container.style.overflow = "hidden";
    //div
    const div = document.createElement('div');
    div.classList.add("alertComponent","alertMessage");
    const p = document.createElement('p');
    p.classList.add("alertMessageText");
    p.textContent = message;
    //btn aceptar
    const btnAceptar = document.createElement('span');
    btnAceptar.textContent = "ACEPTAR";
    btnAceptar.classList.add("alertMessageBtnAceptar","alertBtn");
    btnAceptar.addEventListener('click',()=>{
        div.remove();
        if(redirection){
            window.location.href = redirection;
        };
    });
    div.appendChild(p);
    div.appendChild(btnAceptar);
    container.appendChild(div);
}

export function AlertConfirm(message,redirection = null){
    return new Promise((resolve)=>{
        const container = document.querySelector("body");
        container.style.overflow = "hidden";
        // div
        const div = document.createElement('div');
        div.classList.add("alertComponent","alertMessage");
        const p = document.createElement('p');
        p.classList.add("alertMessageText");
        p.textContent = message;
        //btn aceptar
        const btnAceptar = document.createElement('span');
        btnAceptar.textContent = "ACEPTAR";
        btnAceptar.classList.add("alertMessageBtnAceptar_confirm","alertBtn");
        btnAceptar.addEventListener('click',()=>{
            div.remove();
            resolve(true);
            if(redirection){
                window.location.href = redirection;
            };
        });
        //btn cancelar
        const btnCancelar = document.createElement('span');
        btnCancelar.textContent = "CANCELAR";
        btnCancelar.classList.add("alertMessageBtnCancelar","alertBtn");
        btnCancelar.addEventListener('click',()=>{
            div.remove();
            resolve(false);
            if(redirection){
                window.location.href = redirection;
            };
        });
    
        div.appendChild(p);
        div.appendChild(btnAceptar);
        div.appendChild(btnCancelar);
        container.appendChild(div);
    });
}

export function AlertPrompt(message){
        return new Promise((resolve)=>{
        const container = document.querySelector("body");
        container.style.overflow = "hidden";
        // div
        const div = document.createElement('div');
        div.classList.add("alertComponent","alertMessage");
        const p = document.createElement('p');
        p.classList.add("alertMessageText");
        p.textContent = message;
        //input pidiendo datos
        const input = document.createElement('input');
        input.setAttribute('type','number');
        




        
        //btn aceptar
        const btnAceptar = document.createElement('span');
        btnAceptar.textContent = "ACEPTAR";
        btnAceptar.classList.add("alertMessageBtnAceptar","alertBtn");
        btnAceptar.addEventListener('click',()=>{
            div.remove();
            resolve(true);
            if(redirection){
                window.location.href = redirection;
            };
        });
        //btn cancelar
        const btnCancelar = document.createElement('span');
        btnAceptar.textContent = "CANCELAR";
        btnAceptar.classList.add("alertMessageBtnCancelar","alertBtn");
        btnCancelar.addEventListener('click',()=>{
            div.remove();
            resolve(false);
            if(redirection){
                window.location.href = redirection;
            };
        });
    
        div.appendChild(p);
        div.appendChild(btnAceptar);
        div.appendChild(btnCancelar);
        container.appendChild(div);
    });
}