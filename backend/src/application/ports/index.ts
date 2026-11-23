// Portas de saída: o núcleo depende destas interfaces, não das tecnologias.
export interface Relogio {
  agora(): Date;
}

export interface ResultadoEnvio {
  link: string;
  mensagem: string;
}

export interface Notificador {
  enviar(telefone: string, mensagem: string): Promise<ResultadoEnvio>;
}
