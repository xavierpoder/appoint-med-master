-- Remover el INSERT problemático de la migración anterior
-- El administrador debe registrarse normalmente a través del sistema de auth
-- El sistema detectará automáticamente su rol por el email

-- La función handle_new_user() ya existente creará el perfil automáticamente
-- El AuthContext ya detecta admin por email: 'latitudceroimportaciones@hotmail.com'

-- No necesitamos insertar datos manualmente en profiles
-- Solo aseguramos que el enum tenga el valor 'admin' (ya se agregó en migración anterior)