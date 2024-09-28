"""
Módulo para geração de relatórios em PDF.

Autor: BlackNight
"""

from fpdf import FPDF
import plotly.graph_objects as go
import plotly.io as pio
import io
import base64

class PDFReport(FPDF):
    """
    Classe para gerar relatórios em PDF.

    :param title: Título do relatório
    """
    def __init__(self, title):
        super().__init__()
        self.title = title

    def header(self):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, self.title, 0, 1, 'C')
        self.ln(10)

    def chapter_title(self, title):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, title, 0, 1, 'L')
        self.ln(10)

    def chapter_body(self, body):
        self.set_font('Arial', '', 12)
        self.multi_cell(0, 10, body)
        self.ln()

    def add_chapter(self, title, body):
        self.add_page()
        self.chapter_title(title)
        self.chapter_body(body)

    def add_table(self, data, col_widths):
        self.set_font('Arial', '', 12)
        for row in data:
            for i, item in enumerate(row):
                self.cell(col_widths[i], 10, str(item), border=1)
            self.ln()

    def add_image(self, img_data, x, y, w, h):
        self.image(img_data, x, y, w, h)

    def add_graph(self, data, labels, title):
        # Configurar o Plotly para usar o orca
        pio.orca.config.executable = '/data/data/com.termux/files/usr/bin/orca'
        
        fig = go.Figure(data=[go.Bar(x=labels, y=data)])
        fig.update_layout(title=title)
        img_bytes = fig.to_image(format="png", engine="orca")
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        img_data = io.BytesIO(base64.b64decode(img_base64))
        self.add_page()
        self.image(img_data, x=10, y=10, w=190)

# Exemplo de uso
if __name__ == "__main__":
    pdf = PDFReport("Relatório de Varredura")
    pdf.add_chapter("Portas Abertas", "Porta 80: HTTP\nPorta 443: HTTPS")
    pdf.add_table([["Porta", "Serviço"], [80, "HTTP"], [443, "HTTPS"]], [40, 150])
    pdf.add_graph([80, 443], ["HTTP", "HTTPS"], "Distribuição de Portas Abertas")
    pdf.output("report.pdf")
