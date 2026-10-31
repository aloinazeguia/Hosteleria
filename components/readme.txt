//Se importa el componente
import { AlertMessage } from '';

//Se declaran las variables, message es obligatorio, redirection opcional dependiendo si se quiere redireccionar
let message = "";
let redirection = "";

//es como decir alert(message), se llama de la misma manera
AlertMessage(message,redirection) ||  AlertMessage(message);

*************************
//Se importa el componente
import { AlertConfirm } from '';

//Se declaran las variables, message es obligatorio,
let message = "";


//Se llama a la funcion y se le pasa el parametro
AlertConfirm(message);

//esta funcion devuelve true o false (que viene de aceptar o cancelar);
// por ejemplo, se puede usar de esta manera;

//si es true entonces ( o sea si se le da click en aceptar)
//se usa dentro de una funcion asincrona ya que antes de pasar de la validacion del if, debe de esperar
//a que el alert mande su parametro (true o false);

if (await AlertConfirm(message)) {
    // El usuario hizo clic en ACEPTAR
    // ...acciones si acepta...
    // puede redireccionar si quiere
} else {
    // El usuario hizo clic en CANCELAR
    // ...acciones si cancela...
}

