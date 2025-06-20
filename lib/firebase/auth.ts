import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  createUserWithEmailAndPassword,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db, isFirebaseConfigured } from "./config"

export interface AdminUser {
  uid: string
  email: string
  isAdmin: boolean
  displayName?: string
}

// Verificar si el usuario es administrador
export async function checkAdminStatus(user: User): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) {
    return false
  }

  try {
    const adminDoc = await getDoc(doc(db, "admins", user.uid))
    return adminDoc.exists() && adminDoc.data()?.isAdmin === true
  } catch (error) {
    console.error("Error verificando estado de admin:", error)
    return false
  }
}

// Iniciar sesión como administrador
export async function signInAdmin(email: string, password: string): Promise<AdminUser> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase no configurado")
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Verificar si es administrador
    const isAdmin = await checkAdminStatus(user)

    if (!isAdmin) {
      await signOut(auth)
      throw new Error("No tienes permisos de administrador")
    }

    return {
      uid: user.uid,
      email: user.email!,
      isAdmin: true,
      displayName: user.displayName || undefined,
    }
  } catch (error: any) {
    console.error("Error en inicio de sesión:", error)
    throw new Error(error.message || "Error al iniciar sesión")
  }
}

// Cerrar sesión
export async function signOutAdmin(): Promise<void> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase no configurado")
  }

  try {
    await signOut(auth)
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
    throw error
  }
}

// Escuchar cambios en el estado de autenticación
export function onAuthStateChange(callback: (user: AdminUser | null) => void): () => void {
  if (!isFirebaseConfigured() || !auth) {
    callback(null)
    return () => {}
  }

  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const isAdmin = await checkAdminStatus(user)
      if (isAdmin) {
        callback({
          uid: user.uid,
          email: user.email!,
          isAdmin: true,
          displayName: user.displayName || undefined,
        })
      } else {
        callback(null)
      }
    } else {
      callback(null)
    }
  })
}

// Crear usuario administrador (solo para configuración inicial)
export async function createAdminUser(email: string, password: string): Promise<void> {
  if (!isFirebaseConfigured() || !auth || !db) {
    throw new Error("Firebase no configurado")
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Agregar a la colección de administradores
    await setDoc(doc(db, "admins", user.uid), {
      email: user.email,
      isAdmin: true,
      createdAt: new Date(),
    })

    console.log("Usuario administrador creado exitosamente")
  } catch (error) {
    console.error("Error creando usuario administrador:", error)
    throw error
  }
}

// Agregar una función helper para crear admin desde la consola del navegador
export async function createAdminUserFromConsole(email: string, password: string): Promise<void> {
  if (!isFirebaseConfigured() || !auth || !db) {
    console.error("Firebase no configurado")
    return
  }

  try {
    console.log("Creando usuario administrador...")
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Agregar a la colección de administradores
    await setDoc(doc(db, "admins", user.uid), {
      email: user.email,
      isAdmin: true,
      createdAt: new Date(),
    })

    console.log("✅ Usuario administrador creado exitosamente")
    console.log("Email:", email)
    console.log("UID:", user.uid)
  } catch (error) {
    console.error("❌ Error creando usuario administrador:", error)
  }
}

// Función global para usar en la consola del navegador
if (typeof window !== "undefined") {
  ;(window as any).createAdminUser = createAdminUserFromConsole
}
