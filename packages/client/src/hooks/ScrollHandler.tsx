import { useEffect } from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";

const ScrollHandler = ({ location }: RouteComponentProps) => {
  // const {}
  useEffect(() => {
    const element = document.getElementById(location.hash);

    setTimeout(() => {
      window.scrollTo({
        behavior: element ? "smooth" : "auto",
        top: element ? element.offsetTop : 0,
      });
    }, 100);
  }, [location]);

  return null;
};

export default withRouter(ScrollHandler);
