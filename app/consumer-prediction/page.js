export default function ConsumerPredictionPage() {
  return (
    <section>
      <div className="aboutUsPage">
        <div className="inner">
          <div className="top">
            <p className="text-center title">Consumer Protection Notice</p>
            <div className="bredcrumbs">
              <p className="m-0">
                Home{" "}
                <span>
                  <i className="fas fa-angle-right fs-5 mx-2"></i>
                </span>{" "}
                Consumer
              </p>
            </div>
          </div>
          <div className="content">
            <div
              className="container"
              style={{ position: "relative", top: "-100px" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/cp.png"
                className="img-fluid"
                alt="Consumer Protection"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
