// Redirect users to appropriate dashboard based on their role
export const redirectByRole = (role, navigate) => {
  if (!role) {
    navigate("/login", { replace: true });
    return;
  }

  const r = role.toString().trim();

  switch (r) {
    case "hr":
      navigate("/dashboard/hr", { replace: true });
      break;

    case "employee":
      navigate("/dashboard/employee", { replace: true });
      break;

    case "attendancemanager":
      navigate("/dashboard/attendance", { replace: true });
      break;

    case "hod":
      navigate("/dashboard/hod", { replace: true });
      break;

    default:
      navigate("/login", { replace: true });
  }
};