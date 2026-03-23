import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/iletisim')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='container'>
      <div className='mx-auto'>
        <div className="flex flex-col items-center justify-center my-4 space-y-4">
          <span className="text-4xl">İletişim</span>
          <svg width="61" height="15" className="w-96" viewBox="0 0 61 15" fill="none">
            <path d="M59 3L49.5 12L40 3L30.5 12L21 3L11.5 12L2 3" stroke="#E5E5E5" stroke-width="3"></path>
          </svg>
        </div>

        <div className="contentbox-body">
          <div className="list-group list-group-flush contact-us">
            <div className="list-group-item">
              <div className="row">
                <div className="col-12 col-lg-3">
                  Firma Adı
                </div>
                <div className="col-12 col-lg-4">
                  Yağmur Feracem
                </div>
              </div>
            </div>
            <div className="list-group-item">
              <div className="row">
                <div className="col-12 col-lg-3">
                  Yetkili Kişi
                </div>
                <div className="col-12 col-lg-4">
                  Firma Yetkilisi
                </div>
              </div>
            </div>
            <div className="list-group-item">
              <div className="row">
                <div className="col-12 col-lg-3">
                  Telefon 1
                </div>
                <div className="col-12 col-lg-4">
                  <a href="tel:+90535 688 56 03">
                    0532 379 37 06
                  </a>
                </div>
              </div>
            </div>
            <div className="list-group-item">
              <div className="row">
                <div className="col-12 col-lg-3">
                  Adres
                </div>
                <div className="col-12 col-lg-4">
                  Atatürk, Atatürk Mah Kutsal Sk No:17/B, Sincan/Ankara
                </div>
              </div>
            </div>
            <div className="list-group-item">
              <div className="row">
                <div className="col-12 col-lg-3">
                  Ülke
                </div>
                <div className="col-12 col-lg-4">
                  Türkiye
                </div>
              </div>
            </div>
            <div className="list-group-item">
              <div className="row">
                <div className="col-12 col-lg-3">
                  Şehir
                </div>
                <div className="col-12 col-lg-4">
                  Ankara
                </div>
              </div>
            </div>
            <div className="list-group-item">
              <div className="row">
                <div className="col-12 col-lg-3">
                  Semt
                </div>
                <div className="col-12 col-lg-4">
                  Sincan
                </div>
              </div>
            </div>
            <div className="list-group-item">
              <div className="row">
                <div className="col-12 col-lg-3">
                  Arıza / İade Başvurusu
                </div>
                <div className="col-12 col-lg-7">
                  <a href="/legal">
                    Arıza / İade Başvurusu
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
