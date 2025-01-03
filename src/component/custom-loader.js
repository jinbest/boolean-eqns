import React from "react";
import Loader from "react-loader";

const CustomLoader = ({ loaded }) => {
  return (
    <div className="custom-loader">
      <Loader
        loaded={loaded}
        lines={13}
        length={20}
        width={10}
        radius={30}
        corners={1}
        rotate={0}
        direction={1}
        color="#000"
        speed={1}
        trail={60}
        shadow={false}
        hwaccel={false}
        className="spinner"
        zIndex={1000}
        top="50%"
        left="50%"
        scale={1.0}
        loadedClassName="loadedContent"
      />
    </div>
  );
};

export default CustomLoader;
