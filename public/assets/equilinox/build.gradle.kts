//<KOTLIN>
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
//</KOTLIN>
plugins {
    id("de.rhm176.silk.silk-plugin") version "{{SILK_PLUGIN_VERSION}}"
    //<KOTLIN>
    kotlin("jvm") version "{{KOTLIN_JVM_VERSION}}"
    //</KOTLIN>
    id("maven-publish")
}

group = project.property("maven_group")!!
version = project.property("mod_version")!!

base {
    archivesName.set(project.property("archives_base_name").toString())
}

repositories {
    // Add repositories to retrieve artifacts from in here.
    // You should only use this when depending on other mods because
    // Silk adds the essential maven repositories to download silk loader and libraries from automatically.
    // See https://docs.gradle.org/current/userguide/declaring_repositories.html
    // for more information about repositories.
}

// Optionally configure the silk plugin
silk {
    silkLoaderCoordinates = "de.rhm176.silk:silk-loader:${project.property("loader_version")}"

    // runDir.set(project.file("game"))
}

dependencies {
    equilinox(silk.findEquilinoxGameJar())

    implementation("de.rhm176.silk.silk-api:silk-api:${project.property("silk_api_version")}")
    //<KOTLIN>
    implementation("net.fabricmc:fabric-language-kotlin:${project.property("kotlin_mod_version")}")
    //</KOTLIN>
}

tasks.processResources {
    val expandProps = mutableMapOf<String, Any>(
        "version" to project.version
        //<KOTLIN>
        ,"kotlinModVersion" to project.property("kotlin_mod_version")!!
        //</KOTLIN>
    )

    filesMatching("fabric.mod.json") {
        expand(expandProps)
    }
    inputs.properties(expandProps)
}

val javaVersion = JavaVersion.toVersion(project.findProperty("javaVersion").toString())
java {
    sourceCompatibility = javaVersion
    targetCompatibility = javaVersion
}
//<KOTLIN>
tasks.withType<KotlinCompile>().configureEach {
    compilerOptions {
        val versionString = if (javaVersion == JavaVersion.VERSION_1_8) "1.8" else javaVersion.majorVersion
        jvmTarget.set(JvmTarget.fromTarget(versionString))
    }
}

sourceSets.main {
    java.srcDirs("src/main/java", "src/main/kotlin")
}
//</KOTLIN>

tasks.jar {
    inputs.property("archivesName", project.base.archivesName)

    from("LICENSE") {
        rename { "${it}_${inputs.properties["archivesName"]}" }
    }
}

// configure the maven publication
publishing {
    publications {
        create<MavenPublication>("mavenJava") {
            artifactId = project.property("archives_base_name").toString()

            from(components["java"])
        }
    }

    // See https://docs.gradle.org/current/userguide/publishing_maven.html for information
    // on how to set up publishing.
    repositories {
        // Add repositories to publish to here.
        // Notice: This block does NOT have the same function as the block in the top level.
        // The repositories here will be used for publishing your artifact, not for
        // retrieving dependencies.
    }
}