// Showcase route uses its own nav, so we skip the global Header/FloatingWidgets
const ShowcaseLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <>{children}</>;
};

export default ShowcaseLayout;
