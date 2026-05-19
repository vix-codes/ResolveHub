const AppBrand = ({ size = "md", label = "ResolveHub" }) => {
  const px = size === "sm" ? 18 : size === "lg" ? 28 : 22;

  return (
    <div className="app-brand" aria-label={label} title={label}>
      <img
        className="app-brand__icon"
        src="/favicon.svg"
        alt=""
        width={px}
        height={px}
      />
      <span className="app-brand__text">{label}</span>
    </div>
  );
};

export default AppBrand;

