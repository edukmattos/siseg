function Footer() {
  return (
    <footer className="bg-primary text-on-primary-container border-t border-white/5 py-12 px-8">
      <div className="max-w-[1920px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <span className="text-xl font-extrabold text-white tracking-tighter font-headline mb-4 block">
            Occupational Excellence
          </span>
          <p className="text-sm text-on-primary-container/80">
            Plataforma líder em conformidade de segurança do trabalho no
            território nacional.
          </p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">
            Plataforma
          </h4>
          <ul className="text-sm space-y-2">
            <li>
              <a className="hover:text-white transition-colors" href="#">
                Portal do Gestor
              </a>
            </li>
            <li>
              <a className="hover:text-white transition-colors" href="#">
                API de Integração
              </a>
            </li>
            <li>
              <a className="hover:text-white transition-colors" href="#">
                Segurança de Dados
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">
            Suporte
          </h4>
          <ul className="text-sm space-y-2">
            <li>
              <a className="hover:text-white transition-colors" href="#">
                Central de Ajuda
              </a>
            </li>
            <li>
              <a className="hover:text-white transition-colors" href="#">
                Validação de Certificado
              </a>
            </li>
            <li>
              <a className="hover:text-white transition-colors" href="#">
                Termos de Uso
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">
            Newsletter
          </h4>
          <div className="flex">
            <input
              className="bg-white/10 border-none rounded-l-lg py-2 px-4 text-sm w-full focus:ring-1 focus:ring-white/30 text-white"
              placeholder="E-mail corporativo"
              type="email"
            />
            <button className="bg-white text-primary px-4 rounded-r-lg hover:bg-white/90 transition-colors">
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-[1920px] mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-on-primary-container/60">
          © 2024 Occupational Excellence Treinamentos LTDA. Todos os direitos
          reservados.
        </p>
        <div className="flex gap-6">
          <span className="text-xs text-on-primary-container/60">
            CNPJ: 12.345.678/0001-90
          </span>
          <span className="text-xs text-on-primary-container/60">
            MTE Registro: 99.887.766
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
