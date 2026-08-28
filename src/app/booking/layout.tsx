/*
 * Layout: /booking
 * Full-screen layout WITHOUT global Header/Footer
 * This overrides the root layout to provide a clean booking experience
 */

const BookingLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="booking-layout">
      {children}
    </div>
  );
};

export default BookingLayout;
