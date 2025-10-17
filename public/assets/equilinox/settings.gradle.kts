rootProject.name = "{{MOD_ID}}"

pluginManagement {
    repositories {
        maven {
            url = uri("https://maven.rhm176.de/releases")
            name = "RHM's Maven"
        }
        gradlePluginPortal()
    }
}