import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export type UserRole = "Admin" | "Faculty" | "Student"

export interface UserData {
    user_id: number
    email: string
    role: UserRole
    acd_admin?: {
        admin_name: string
    }
    acd_student?: {
        student_name: string
        acd_department?: {
            department_name: string
        }
    }
    acd_staff?: {
        staff_name: string
        acd_department?: {
            department_name: string
        }
    }
}

export function useUser() {
    const router = useRouter()
    const [userRole, setUserRole] = useState<UserRole | null>(null)
    const [userData, setUserData] = useState<UserData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch("/api/auth/me", {
                    credentials: "include",
                })
                if (response.ok) {
                    const data = await response.json()
                    setUserRole(data.user?.role || null)
                    setUserData(data.user || null)
                }
            } catch (error) {
                console.error("Failed to fetch user:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchUser()
    }, [])

    const getUserDisplayName = () => {
        if (!userData) return "User"
        if (userData.acd_admin?.admin_name) return userData.acd_admin.admin_name
        if (userData.acd_student?.student_name) return userData.acd_student.student_name
        if (userData.acd_staff?.staff_name) return userData.acd_staff.staff_name
        return userData.email.split("@")[0]
    }

    const getUserEmail = () => {
        return userData?.email || ""
    }

    const getInitials = () => {
        const name = getUserDisplayName()
        if (name === "User") return "U"
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
            router.push("/login")
        } catch (error) {
            console.error("Logout failed:", error)
        }
    }

    return {
        userRole,
        userData,
        isLoading,
        getUserDisplayName,
        getUserEmail,
        getInitials,
        logout,
    }
}
