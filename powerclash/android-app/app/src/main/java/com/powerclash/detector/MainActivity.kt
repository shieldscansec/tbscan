package com.powerclash.detector

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.powerclash.detector.services.CheatDetectionService
import com.powerclash.detector.services.MemoryAnalysisService
import com.powerclash.detector.services.ProcessMonitorService
import com.powerclash.detector.ui.theme.PowerClashTheme
import com.powerclash.detector.utils.NotificationHelper
import com.powerclash.detector.utils.PermissionHelper
import com.powerclash.detector.utils.SystemInfoHelper
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    
    private val TAG = "MainActivity"
    
    // Serviços de detecção
    private lateinit var cheatDetectionService: CheatDetectionService
    private lateinit var memoryAnalysisService: MemoryAnalysisService
    private lateinit var processMonitorService: ProcessMonitorService
    
    // Estado da aplicação
    private var isScanning = false
    private var isServiceRunning = false
    private var lastScanResult = ""
    private var detectionCount = 0
    
    // Permissões necessárias
    private val requiredPermissions = arrayOf(
        Manifest.permission.READ_EXTERNAL_STORAGE,
        Manifest.permission.WRITE_EXTERNAL_STORAGE,
        Manifest.permission.ACCESS_NETWORK_STATE,
        Manifest.permission.INTERNET,
        Manifest.permission.FOREGROUND_SERVICE,
        Manifest.permission.POST_NOTIFICATIONS
    )
    
    // Handler para atualizações da UI
    private val mainHandler = Handler(Looper.getMainLooper())
    
    // Callback para resultado de permissões
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.entries.all { it.value }
        if (allGranted) {
            Log.d(TAG, "Todas as permissões concedidas")
            initializeServices()
        } else {
            Log.w(TAG, "Algumas permissões foram negadas")
            Toast.makeText(this, "Permissões necessárias para funcionamento completo", Toast.LENGTH_LONG).show()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.d(TAG, "MainActivity criada")
        
        // Verificar permissões
        checkAndRequestPermissions()
        
        // Configurar tema
        setContent {
            PowerClashTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainScreen(
                        isScanning = isScanning,
                        isServiceRunning = isServiceRunning,
                        lastScanResult = lastScanResult,
                        detectionCount = detectionCount,
                        onStartScan = { startScan() },
                        onStopScan = { stopScan() },
                        onStartService = { startDetectionService() },
                        onStopService = { stopDetectionService() },
                        onRefresh = { refreshStatus() }
                    )
                }
            }
        }
    }
    
    private fun checkAndRequestPermissions() {
        val permissionsToRequest = mutableListOf<String>()
        
        for (permission in requiredPermissions) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission)
            }
        }
        
        if (permissionsToRequest.isNotEmpty()) {
            permissionLauncher.launch(permissionsToRequest.toTypedArray())
        } else {
            Log.d(TAG, "Todas as permissões já concedidas")
            initializeServices()
        }
    }
    
    private fun initializeServices() {
        try {
            Log.d(TAG, "Inicializando serviços...")
            
            // Inicializar serviços de detecção
            cheatDetectionService = CheatDetectionService(this)
            memoryAnalysisService = MemoryAnalysisService(this)
            processMonitorService = ProcessMonitorService(this)
            
            // Inicializar serviços
            lifecycleScope.launch {
                try {
                    cheatDetectionService.initialize()
                    memoryAnalysisService.initialize()
                    processMonitorService.initialize()
                    Log.d(TAG, "Serviços inicializados com sucesso")
                } catch (e: Exception) {
                    Log.e(TAG, "Erro ao inicializar serviços", e)
                }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao inicializar serviços", e)
        }
    }
    
    private fun startScan() {
        if (isScanning) {
            Toast.makeText(this, "Scan já está em andamento", Toast.LENGTH_SHORT).show()
            return
        }
        
        Log.d(TAG, "Iniciando scan...")
        isScanning = true
        
        lifecycleScope.launch {
            try {
                // Executar scan completo
                val scanResult = performFullScan()
                
                mainHandler.post {
                    lastScanResult = scanResult
                    isScanning = false
                    Toast.makeText(this@MainActivity, "Scan concluído", Toast.LENGTH_SHORT).show()
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Erro durante scan", e)
                mainHandler.post {
                    isScanning = false
                    Toast.makeText(this@MainActivity, "Erro durante scan: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
    
    private fun stopScan() {
        if (!isScanning) {
            Toast.makeText(this, "Nenhum scan em andamento", Toast.LENGTH_SHORT).show()
            return
        }
        
        Log.d(TAG, "Parando scan...")
        isScanning = false
        Toast.makeText(this, "Scan interrompido", Toast.LENGTH_SHORT).show()
    }
    
    private suspend fun performFullScan(): String {
        val scanResults = mutableListOf<String>()
        
        try {
            // 1. Scan de processos
            Log.d(TAG, "Executando scan de processos...")
            val processResults = cheatDetectionService.scanProcesses()
            scanResults.add("Processos: ${processResults.size} suspeitos encontrados")
            
            // 2. Scan de memória
            Log.d(TAG, "Executando scan de memória...")
            val memoryResults = memoryAnalysisService.scanMemory()
            scanResults.add("Memória: ${memoryResults.size} anomalias detectadas")
            
            // 3. Scan de arquivos
            Log.d(TAG, "Executando scan de arquivos...")
            val fileResults = cheatDetectionService.scanFiles()
            scanResults.add("Arquivos: ${fileResults.size} suspeitos encontrados")
            
            // 4. Scan de sistema
            Log.d(TAG, "Executando scan de sistema...")
            val systemResults = cheatDetectionService.scanSystem()
            scanResults.add("Sistema: ${systemResults.size} anomalias detectadas")
            
            // 5. Monitoramento de rede
            Log.d(TAG, "Executando monitoramento de rede...")
            val networkResults = cheatDetectionService.scanNetwork()
            scanResults.add("Rede: ${networkResults.size} conexões suspeitas")
            
            // Atualizar contador de detecções
            val totalDetections = processResults.size + memoryResults.size + 
                                fileResults.size + systemResults.size + networkResults.size
            detectionCount = totalDetections
            
            // Enviar resultados para o servidor
            sendResultsToServer(scanResults)
            
            return scanResults.joinToString("\n")
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro durante scan completo", e)
            return "Erro durante scan: ${e.message}"
        }
    }
    
    private fun startDetectionService() {
        if (isServiceRunning) {
            Toast.makeText(this, "Serviço já está rodando", Toast.LENGTH_SHORT).show()
            return
        }
        
        try {
            Log.d(TAG, "Iniciando serviço de detecção...")
            
            val intent = Intent(this, CheatDetectionService::class.java)
            startForegroundService(intent)
            
            isServiceRunning = true
            Toast.makeText(this, "Serviço de detecção iniciado", Toast.LENGTH_SHORT).show()
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao iniciar serviço", e)
            Toast.makeText(this, "Erro ao iniciar serviço: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
    
    private fun stopDetectionService() {
        if (!isServiceRunning) {
            Toast.makeText(this, "Serviço não está rodando", Toast.LENGTH_SHORT).show()
            return
        }
        
        try {
            Log.d(TAG, "Parando serviço de detecção...")
            
            val intent = Intent(this, CheatDetectionService::class.java)
            stopService(intent)
            
            isServiceRunning = false
            Toast.makeText(this, "Serviço de detecção parado", Toast.LENGTH_SHORT).show()
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao parar serviço", e)
            Toast.makeText(this, "Erro ao parar serviço: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
    
    private fun refreshStatus() {
        Log.d(TAG, "Atualizando status...")
        
        // Verificar status dos serviços
        isServiceRunning = CheatDetectionService.isRunning()
        
        // Atualizar informações do sistema
        updateSystemInfo()
        
        Toast.makeText(this, "Status atualizado", Toast.LENGTH_SHORT).show()
    }
    
    private fun updateSystemInfo() {
        lifecycleScope.launch {
            try {
                val systemInfo = SystemInfoHelper.getSystemInfo(this@MainActivity)
                Log.d(TAG, "Informações do sistema: $systemInfo")
            } catch (e: Exception) {
                Log.e(TAG, "Erro ao obter informações do sistema", e)
            }
        }
    }
    
    private suspend fun sendResultsToServer(results: List<String>) {
        try {
            // Implementar envio para servidor
            Log.d(TAG, "Enviando resultados para servidor...")
            // TODO: Implementar comunicação com servidor
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao enviar resultados para servidor", e)
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "MainActivity destruída")
        
        // Parar serviços se necessário
        if (isServiceRunning) {
            stopDetectionService()
        }
    }
}

@Composable
fun MainScreen(
    isScanning: Boolean,
    isServiceRunning: Boolean,
    lastScanResult: String,
    detectionCount: Int,
    onStartScan: () -> Unit,
    onStopScan: () -> Unit,
    onStartService: () -> Unit,
    onStopService: () -> Unit,
    onRefresh: () -> Unit
) {
    val context = LocalContext.current
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Header
        Text(
            text = "🛡️ PowerClash",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        
        Text(
            text = "Sistema Avançado de Detecção de Cheats",
            fontSize = 16.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = 24.dp)
        )
        
        // Status do Sistema
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Status do Sistema",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Serviço de Detecção:")
                    Text(
                        text = if (isServiceRunning) "🟢 Ativo" else "🔴 Inativo",
                        color = if (isServiceRunning) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error
                    )
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Total de Detecções:")
                    Text(
                        text = detectionCount.toString(),
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }
        
        // Controles de Scan
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Controles de Scan",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Button(
                        onClick = onStartScan,
                        enabled = !isScanning,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Text(if (isScanning) "Escaneando..." else "Iniciar Scan")
                    }
                    
                    Button(
                        onClick = onStopScan,
                        enabled = isScanning,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Text("Parar Scan")
                    }
                }
            }
        }
        
        // Controles de Serviço
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Controles de Serviço",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 16.dp)
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Button(
                        onClick = onStartService,
                        enabled = !isServiceRunning,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Text("Iniciar Serviço")
                    }
                    
                    Button(
                        onClick = onStopService,
                        enabled = isServiceRunning,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Text("Parar Serviço")
                    }
                }
            }
        }
        
        // Botão de Atualizar
        Button(
            onClick = onRefresh,
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.secondary
            )
        ) {
            Text("Atualizar Status")
        }
        
        // Resultados do Último Scan
        if (lastScanResult.isNotEmpty()) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Resultados do Último Scan",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    
                    Text(
                        text = lastScanResult,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
        
        // Informações do Sistema
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Informações do Sistema",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                
                Text(
                    text = "Android ${android.os.Build.VERSION.RELEASE}",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Text(
                    text = "API Level: ${android.os.Build.VERSION.SDK_INT}",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Text(
                    text = "Dispositivo: ${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}