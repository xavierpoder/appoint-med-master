const signUp = async (email: string, password: string, userData: {
  firstName: string;
  lastName: string;
  role: 'doctor' | 'patient';
  phone: string;
  specialty?: string;
}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role,
        phone: userData.phone,
        specialty: userData.specialty || null
      }
    }
  });
  return { data, error };
};
