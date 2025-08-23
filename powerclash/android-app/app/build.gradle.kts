plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
    id("kotlin-parcelize")
    id("dagger.hilt.android.plugin")
    id("kotlin-android")
}

android {
    namespace = "com.powerclash.detector"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.powerclash.detector"
        minSdk = 28
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
        
        // Configurações específicas para detecção de cheats
        ndk {
            abiFilters += listOf("armeabi-v7a", "arm64-v8a", "x86", "x86_64")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
        debug {
            isMinifyEnabled = false
            isDebuggable = true
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf(
            "-opt-in=kotlin.RequiresOptIn",
            "-opt-in=kotlinx.coroutines.ExperimentalCoroutinesApi",
            "-opt-in=androidx.compose.material3.ExperimentalMaterial3Api"
        )
    }

    buildFeatures {
        compose = true
        buildConfig = true
        aidl = false
        renderScript = false
        resValues = false
        shaders = false
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.4"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
            excludes += "META-INF/DEPENDENCIES"
            excludes += "META-INF/LICENSE"
            excludes += "META-INF/LICENSE.txt"
            excludes += "META-INF/license.txt"
            excludes += "META-INF/NOTICE"
            excludes += "META-INF/NOTICE.txt"
            excludes += "META-INF/notice.txt"
            excludes += "META-INF/ASL2.0"
            excludes += "META-INF/*.kotlin_module"
        }
    }

    // Configurações de segurança
    signingConfigs {
        create("release") {
            // Configurar assinatura de release
            storeFile = file("keystore/release.keystore")
            storePassword = "powerclash123"
            keyAlias = "powerclash"
            keyPassword = "powerclash123"
        }
    }
}

dependencies {
    // Core Android
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")
    
    // Compose
    implementation(platform("androidx.compose:compose-bom:2023.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.runtime:runtime")
    implementation("androidx.compose.runtime:runtime-livedata")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.animation:animation")
    
    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.5")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")
    
    // Hilt (Dependency Injection)
    implementation("com.google.dagger:hilt-android:2.48")
    kapt("com.google.dagger:hilt-android-compiler:2.48")
    implementation("androidx.hilt:hilt-work:1.1.0")
    kapt("androidx.hilt:hilt-compiler:1.1.0")
    
    // WorkManager
    implementation("androidx.work:work-runtime-ktx:2.9.0")
    implementation("androidx.work:work-multiprocess:2.9.0")
    
    // Room Database
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
    
    // DataStore (Preferences)
    implementation("androidx.datastore:datastore-preferences:1.0.0")
    
    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.retrofit2:converter-scalars:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("com.squareup.okhttp3:okhttp-urlconnection:4.12.0")
    
    // WebSocket
    implementation("io.socket:socket.io-client:2.1.0")
    
    // JSON
    implementation("com.google.code.gson:gson:2.10.1")
    implementation("com.squareup.moshi:moshi:1.15.0")
    implementation("com.squareup.moshi:moshi-kotlin:1.15.0")
    kapt("com.squareup.moshi:moshi-kotlin-codegen:1.15.0")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    
    // Security
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("androidx.biometric:biometric:1.1.0")
    
    // Permissions
    implementation("com.google.accompanist:accompanist-permissions:0.32.0")
    
    // Image Loading
    implementation("io.coil-kt:coil-compose:2.5.0")
    
    // Charts and Visualization
    implementation("com.github.PhilJay:MPAndroidChart:v3.1.0")
    implementation("com.github.PhilJay:MPAndroidChart-Realm:v3.1.0")
    
    // ML Kit (Machine Learning)
    implementation("com.google.mlkit:common:18.10.0")
    implementation("com.google.mlkit:vision-common:17.3.0")
    implementation("com.google.mlkit:object-detection:17.0.0")
    
    // TensorFlow Lite
    implementation("org.tensorflow:tensorflow-lite:2.14.0")
    implementation("org.tensorflow:tensorflow-lite-support:0.4.4")
    implementation("org.tensorflow:tensorflow-lite-metadata:0.4.4")
    
    // Native Libraries for Detection
    implementation("com.github.topjohnwu.libsu:core:5.2.1")
    
    // System Information
    implementation("com.github.MikhaelJ:system-info:1.0.0")
    
    // Process and Memory Analysis
    implementation("com.github.anrwatchdog:anrwatchdog:1.4.0")
    
    // File System Analysis
    implementation("commons-io:commons-io:2.11.0")
    
    // Network Analysis
    implementation("org.pcap4j:pcap4j-core:1.8.2")
    implementation("org.pcap4j:pcap4j-packetfactory-static:1.8.2")
    
    // Logging
    implementation("com.jakewharton.timber:timber:5.0.1")
    implementation("com.orhanobut:logger:2.2.0")
    
    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testImplementation("org.mockito:mockito-core:5.7.0")
    testImplementation("org.mockito:mockito-inline:5.2.0")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.2.1")
    testImplementation("androidx.arch.core:core-testing:2.2.0")
    testImplementation("androidx.test.ext:junit:1.1.5")
    testImplementation("androidx.test.espresso:espresso-core:3.5.1")
    testImplementation(platform("androidx.compose:compose-bom:2023.10.01"))
    testImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
    
    // Debug Tools
    debugImplementation("com.squareup.leakcanary:leakcanary-android:2.12")
}

// Configurações específicas para detecção de cheats
android {
    // Habilitar NDK para análise nativa
    ndkVersion = "25.2.9519653"
    
    // Configurações de segurança
    buildTypes {
        getByName("release") {
            // Ofuscar código para dificultar reverse engineering
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            
            // Configurações de segurança
            buildConfigField("boolean", "ENABLE_DEBUG", "false")
            buildConfigField("boolean", "ENABLE_LOGGING", "false")
            buildConfigField("String", "API_BASE_URL", "\"https://api.powerclash.com\"")
        }
        
        getByName("debug") {
            buildConfigField("boolean", "ENABLE_DEBUG", "true")
            buildConfigField("boolean", "ENABLE_LOGGING", "true")
            buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3001\"")
        }
    }
    
    // Configurações de assinatura
    signingConfigs {
        getByName("debug") {
            storeFile = file("keystore/debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }
    
    // Configurações de NDK
    ndk {
        abiFilters += listOf("armeabi-v7a", "arm64-v8a", "x86", "x86_64")
    }
    
    // Configurações de packaging
    packagingOptions {
        jniLibs {
            useLegacyPackaging = true
        }
    }
}

// Configurações do Kotlin
kotlin {
    jvmToolchain(17)
}

// Configurações do Kapt
kapt {
    correctErrorTypes = true
    useBuildCache = true
}

// Configurações do Hilt
hilt {
    enableAggregatingTask = true
}

// Configurações de ProGuard
android.buildTypes.getByName("release") {
    proguardFiles(
        getDefaultProguardFile("proguard-android-optimize.txt"),
        "proguard-rules.pro"
    )
}

// Configurações de lint
android {
    lint {
        abortOnError = false
        checkReleaseBuilds = false
        disable += "MissingTranslation"
        disable += "ExtraTranslation"
    }
}

// Configurações de aapt
android {
    aaptOptions {
        cruncherEnabled = false
    }
}

// Configurações de dex
android {
    dexOptions {
        javaMaxHeapSize = "4g"
        preDexLibraries = false
    }
}

// Configurações de gradle
gradle.projectsEvaluated {
    tasks.withType<JavaCompile> {
        options.compilerArgs.addAll(listOf("-Xlint:unchecked", "-Xlint:deprecation"))
    }
}