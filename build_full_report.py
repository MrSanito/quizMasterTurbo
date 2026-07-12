from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    HRFlowable, KeepTogether, ListFlowable, ListItem
)
from reportlab.platypus import Flowable
import math

# ─── COLOURS ─────────────────────────────────────────────────────────────────
BLACK  = colors.black
WHITE  = colors.white
LGRAY  = colors.HexColor('#F2F2F2')
MGRAY  = colors.HexColor('#CCCCCC')
DGRAY  = colors.HexColor('#444444')
BGRAY  = colors.HexColor('#888888')
W, H   = A4

# ─── STYLES ──────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def S(name, **kw):
    base = styles[name]
    ns = ParagraphStyle(base.name + str(hash(str(kw))), parent=base, **kw)
    return ns

cover_title  = S('Title', fontSize=22, leading=28, textColor=BLACK, alignment=TA_CENTER, spaceAfter=6)
cover_sub    = S('Title', fontSize=14, leading=18, textColor=DGRAY,  alignment=TA_CENTER, spaceAfter=4)
ch_title     = S('Heading1', fontSize=15, leading=20, textColor=BLACK, spaceBefore=0, spaceAfter=8, fontName='Helvetica-Bold')
sec_title    = S('Heading2', fontSize=12, leading=16, textColor=BLACK, spaceBefore=10, spaceAfter=5, fontName='Helvetica-Bold')
subsec_title = S('Heading3', fontSize=10, leading=14, textColor=DGRAY, spaceBefore=7, spaceAfter=4, fontName='Helvetica-Bold')
body         = S('Normal', fontSize=10, leading=14.5, textColor=BLACK, alignment=TA_JUSTIFY, spaceAfter=5)
body_l       = S('Normal', fontSize=10, leading=14.5, textColor=BLACK, alignment=TA_LEFT,    spaceAfter=5)
center_s     = S('Normal', fontSize=10, leading=14,   textColor=BLACK, alignment=TA_CENTER)
bold_s       = S('Normal', fontSize=10, leading=14,   textColor=BLACK, fontName='Helvetica-Bold')
small_s      = S('Normal', fontSize=8,  leading=11,   textColor=DGRAY)
code_s       = S('Normal', fontSize=8,  leading=12,   textColor=BLACK, fontName='Courier',
                 backColor=LGRAY, leftIndent=10, rightIndent=10, spaceBefore=2, spaceAfter=4)
caption_s    = S('Normal', fontSize=8.5, leading=12, textColor=DGRAY, alignment=TA_CENTER, spaceAfter=8)
bullet_s     = S('Normal', fontSize=10, leading=14.5, textColor=BLACK, alignment=TA_JUSTIFY,
                 leftIndent=16, firstLineIndent=-14, spaceAfter=4)
toc_s        = S('Normal', fontSize=10, leading=16, textColor=BLACK)
toc_pg       = S('Normal', fontSize=10, leading=16, textColor=BLACK, alignment=TA_RIGHT)

def P(t, st=body):       return Paragraph(t, st)
def B(t):                return Paragraph(f'• {t}', bullet_s)
def SP(n=6):             return Spacer(1, n)
def HR():                return HRFlowable(width='100%', thickness=0.5, color=MGRAY, spaceBefore=4, spaceAfter=4)
def PB():                return PageBreak()
def H1(t):               return P(t, ch_title)
def H2(t):               return P(t, sec_title)
def H3(t):               return P(t, subsec_title)

def code_block(lines):
    rows = [[P(l, code_s)] for l in lines]
    t = Table(rows, colWidths=[15.5*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LGRAY),
        ('BOX',        (0,0), (-1,-1), 0.5, MGRAY),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    return t

def std_table(headers, rows, col_widths):
    data = [headers] + rows
    t = Table(data, colWidths=col_widths)
    ts = TableStyle([
        ('BACKGROUND',    (0,0), (-1,0),  DGRAY),
        ('TEXTCOLOR',     (0,0), (-1,0),  WHITE),
        ('FONTNAME',      (0,0), (-1,0),  'Helvetica-Bold'),
        ('FONTNAME',      (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE',      (0,0), (-1,-1), 9),
        ('LEADING',       (0,0), (-1,-1), 13),
        ('ROWBACKGROUNDS',(0,1), (-1,-1), [WHITE, LGRAY]),
        ('GRID',          (0,0), (-1,-1), 0.4, MGRAY),
        ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING',    (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING',   (0,0), (-1,-1), 5),
    ])
    t.setStyle(ts)
    return t

# ─── DIAGRAM FLOWABLE ────────────────────────────────────────────────────────
class Diag(Flowable):
    def __init__(self, fn, w, h):
        super().__init__()
        self.fn = fn
        self.width  = w
        self.height = h
    def draw(self):
        self.fn(self.canv, self.width, self.height)

def diag(fn, w=15*cm, h=12*cm, cap=''):
    items = [Diag(fn, w, h)]
    if cap:
        items += [SP(3), P(f'<i>{cap}</i>', caption_s)]
    return items

# ─── LOW-LEVEL DRAWING HELPERS ───────────────────────────────────────────────
def rbox(c, x, y, w, h, text, fill=LGRAY, stroke=BLACK, fs=9, bold=False, textcolor=BLACK):
    c.setFillColor(fill); c.setStrokeColor(stroke); c.setLineWidth(0.7)
    c.roundRect(x, y, w, h, 4, fill=1, stroke=1)
    c.setFillColor(textcolor)
    c.setFont('Helvetica-Bold' if bold else 'Helvetica', fs)
    lines = text.split('\n')
    lh = fs * 1.3
    total = lh * len(lines)
    for i, l in enumerate(lines):
        c.drawCentredString(x + w/2, y + h/2 + total/2 - (i+0.75)*lh, l)

def arr(c, x1, y1, x2, y2, label='', lfs=7):
    c.setStrokeColor(BLACK); c.setLineWidth(0.7)
    c.line(x1, y1, x2, y2)
    dx, dy = x2-x1, y2-y1
    L = math.hypot(dx, dy)
    if L == 0: return
    ux, uy = dx/L, dy/L
    ax, ay = -uy*4, ux*4
    c.setFillColor(BLACK)
    p = c.beginPath()
    p.moveTo(x2, y2)
    p.lineTo(x2-ux*7+ax, y2-uy*7+ay)
    p.lineTo(x2-ux*7-ax, y2-uy*7-ay)
    p.close(); c.drawPath(p, fill=1, stroke=0)
    if label:
        c.setFont('Helvetica', lfs); c.setFillColor(DGRAY)
        mx, my = (x1+x2)/2, (y1+y2)/2
        c.drawCentredString(mx, my+3, label)
        c.setFillColor(BLACK)

def diam(c, cx, cy, w, h, text, fs=8):
    c.setFillColor(LGRAY); c.setStrokeColor(BLACK); c.setLineWidth(0.7)
    p = c.beginPath()
    p.moveTo(cx, cy+h/2); p.lineTo(cx+w/2, cy)
    p.lineTo(cx, cy-h/2); p.lineTo(cx-w/2, cy); p.close()
    c.drawPath(p, fill=1, stroke=1)
    c.setFillColor(BLACK); c.setFont('Helvetica', fs)
    lines = text.split('\n')
    for i, l in enumerate(lines):
        c.drawCentredString(cx, cy + (len(lines)-1-i*2)*fs*0.45, l)

def datastore(c, label, x, y, w=100, h=20):
    c.setStrokeColor(BLACK); c.setLineWidth(0.7); c.setFillColor(WHITE)
    c.rect(x, y, w, h, fill=1, stroke=1)
    c.line(x+10, y, x+10, y+h)
    c.setFont('Helvetica', 8); c.setFillColor(BLACK)
    c.drawString(x+14, y+h/2-4, label)

def stick(c, label, x, y):
    c.setStrokeColor(BLACK); c.setFillColor(WHITE); c.setLineWidth(0.7)
    c.circle(x, y+36, 9, fill=1, stroke=1)
    c.line(x, y+27, x, y+10)
    c.line(x, y+22, x-12, y+12); c.line(x, y+22, x+12, y+12)
    c.line(x, y+10, x-9, y-5); c.line(x, y+10, x+9, y-5)
    c.setFont('Helvetica-Bold', 8); c.setFillColor(BLACK)
    c.drawCentredString(x, y-14, label)

def uc_oval(c, cx, cy, label, rx=70, ry=13):
    c.setFillColor(LGRAY); c.setStrokeColor(BLACK); c.setLineWidth(0.7)
    c.ellipse(cx-rx, cy-ry, cx+rx, cy+ry, fill=1, stroke=1)
    c.setFont('Helvetica', 8); c.setFillColor(BLACK)
    c.drawCentredString(cx, cy-3.5, label)

# ═══════════════════════════════════════════════════════════════════════════
#  DIAGRAMS
# ═══════════════════════════════════════════════════════════════════════════

# ── 1. System Architecture ──────────────────────────────────────────────────
def arch_diag(c, W, H):
    c.setFont('Helvetica-Bold', 11)
    c.drawCentredString(W/2, H-14, 'System Architecture — QuizMaster Turbo')
    c.setFont('Helvetica', 8); c.setFillColor(DGRAY)
    c.drawCentredString(W/2, H-26, 'Three-tier architecture with dual-database backend (Hybrid Reality Model)')
    c.setFillColor(BLACK)

    # tier bands
    bands = [(H-45, H-95, 'TIER 1 — PRESENTATION (Browser)'),
             (H-100,(H-230), 'TIER 2 — BUSINESS LOGIC (Node.js Services)'),
             (H-235,(H-340), 'TIER 3 — DATA (Persistence)')]
    for y1, y2, label in bands:
        c.setFillColor(LGRAY); c.setStrokeColor(MGRAY); c.setLineWidth(0.4)
        c.rect(8, y2, W-16, y1-y2, fill=1, stroke=1)
        c.setFont('Helvetica-Bold', 7); c.setFillColor(DGRAY)
        c.drawString(12, y1-10, label)
        c.setFillColor(BLACK)

    # Browser box
    rbox(c, W/2-75, H-90, 150, 34, 'Browser — Next.js (React)\nJWT Bearer · Socket.IO Client', fill=WHITE, bold=True, fs=8)

    # HTTP server
    rbox(c, 50, H-190, 140, 34, 'HTTP Server\n(Express.js · REST API)', fill=WHITE, bold=True, fs=8)
    # WS server
    rbox(c, W-190, H-190, 140, 34, 'WebSocket Server\n(Socket.IO · Game Engine)', fill=WHITE, bold=True, fs=8)

    # arrows browser <-> HTTP
    arr(c, W/2-75, H-75, 120, H-156, 'REST (Auth, Room, Results)')
    arr(c, 190, H-156, W/2-75, H-80)

    # arrows browser <-> WS
    arr(c, W/2+75, H-75, W-190, H-156, 'Socket.IO Events')
    arr(c, W-190, H-180, W/2+75, H-80)

    # WS → HTTP (internal finalize)
    arr(c, W-190, H-173, 190, H-173, 'POST /finalize (internal)')

    # Redis
    rbox(c, 50, H-315, 140, 34, 'Redis (ioredis)\nVolatile Game State', fill=WHITE, bold=True, fs=8)
    # PG
    rbox(c, W-190, H-315, 140, 34, 'PostgreSQL (Prisma)\nDurable Persistent Data', fill=WHITE, bold=True, fs=8)

    arr(c, 120, H-190, 120, H-281, 'R/W scores,\nlobby, answers')
    arr(c, W-120, H-190, W-120, H-281, 'R/W users,\nquizzes, results')
    arr(c, 190, H-298, W-190, H-298, 'Bulk migrate: Redis→PG at game end')

    # legend
    c.setFillColor(LGRAY); c.setStrokeColor(MGRAY); c.setLineWidth(0.4)
    c.rect(W-130, 8, 124, 55, fill=1, stroke=1)
    c.setFont('Helvetica-Bold', 7); c.setFillColor(BLACK)
    c.drawString(W-124, 54, 'Legend')
    c.setFont('Helvetica', 7)
    for i, t in enumerate(['→  REST HTTP/JSON', '→  Socket.IO Events', '→  Internal HTTP call', '→  DB Read/Write']):
        c.drawString(W-124, 44-i*10, t)

# ── 2. DFD Level 0 ──────────────────────────────────────────────────────────
def dfd0(c, W, H):
    c.setFont('Helvetica-Bold', 11); c.drawCentredString(W/2, H-14, 'DFD Level 0 — Context Diagram')
    c.setFont('Helvetica', 8); c.setFillColor(DGRAY)
    c.drawCentredString(W/2, H-26, 'QuizMaster Turbo as a single process with external actors')
    c.setFillColor(BLACK)

    # External entities
    def ext_box(label, sublabel, x, y):
        c.setFillColor(MGRAY); c.setStrokeColor(BLACK); c.setLineWidth(0.8)
        c.rect(x, y, 80, 40, fill=1, stroke=1)
        c.setFont('Helvetica-Bold', 9); c.setFillColor(BLACK)
        c.drawCentredString(x+40, y+26, label)
        c.setFont('Helvetica', 7); c.setFillColor(DGRAY)
        c.drawCentredString(x+40, y+12, sublabel); c.setFillColor(BLACK)

    ext_box('Host', '(Auth User)', 20, H/2-20)
    ext_box('Player(s)', '(Auth Users)', W-100, H/2-20)

    # Central process
    cx, cy, r = W/2, H/2, 65
    c.setFillColor(LGRAY); c.setStrokeColor(BLACK); c.setLineWidth(1)
    c.circle(cx, cy, r, fill=1, stroke=1)
    c.setFont('Helvetica-Bold', 10); c.setFillColor(BLACK)
    c.drawCentredString(cx, cy+12, 'QuizMaster')
    c.drawCentredString(cx, cy-2,  'Turbo')
    c.setFont('Helvetica', 7); c.setFillColor(DGRAY)
    c.drawCentredString(cx, cy-14, '(Real-Time Quiz System)')
    c.setFillColor(BLACK)

    # Data stores
    datastore(c, 'D1: Redis (Volatile)', W/2-55, H/2-130, 110, 20)
    datastore(c, 'D2: PostgreSQL (Durable)', W/2-65, H/2+105, 130, 20)

    # flows
    arr(c, 100, H/2+28, cx-r, cy+20, 'Login / Room create / Start')
    arr(c, cx-r, cy-10, 100, H/2-15, 'Room code / JWT Token')
    arr(c, cx+r, cy+20, W-100, H/2+28, 'Questions / Live Updates')
    arr(c, W-100, H/2-15, cx+r, cy-10, 'Answers / Join Room')
    arr(c, cx, cy-r, W/2, H/2-110, 'R/W Scores, Answers')
    arr(c, W/2, H/2+105, cx, cy+r, 'Read Quizzes / Write Results')

# ── 3. DFD Level 1 ──────────────────────────────────────────────────────────
def dfd1(c, W, H):
    c.setFont('Helvetica-Bold', 11); c.drawCentredString(W/2, H-14, 'DFD Level 1 — Major Subsystems')
    c.setFont('Helvetica', 8); c.setFillColor(DGRAY)
    c.drawCentredString(W/2, H-26, 'Decomposed view showing four key processes and data flow between them')
    c.setFillColor(BLACK)

    procs = [
        (W*0.22, H*0.80, 'P1\nAuth'),
        (W*0.67, H*0.80, 'P2\nRoom/Lobby Mgmt'),
        (W*0.22, H*0.40, 'P3\nGame Engine'),
        (W*0.67, H*0.40, 'P4\nResult Persistence'),
    ]
    r = 46
    for px, py, label in procs:
        c.setFillColor(LGRAY); c.setStrokeColor(BLACK); c.setLineWidth(0.8)
        c.circle(px, py, r, fill=1, stroke=1)
        c.setFont('Helvetica-Bold', 8); c.setFillColor(BLACK)
        for i, l in enumerate(label.split('\n')):
            c.drawCentredString(px, py+8-i*12, l)

    # data stores
    datastore(c, 'D1: Redis', W/2-50, H*0.58, 100, 20)
    datastore(c, 'D2: PostgreSQL', W/2-60, H*0.19, 120, 20)

    # external
    c.setFillColor(MGRAY); c.setStrokeColor(BLACK); c.setLineWidth(0.8)
    c.rect(8, H*0.80-18, 60, 36, fill=1, stroke=1)
    c.setFont('Helvetica-Bold', 8); c.setFillColor(BLACK)
    c.drawCentredString(38, H*0.80+4, 'User')
    c.drawCentredString(38, H*0.80-8, '(Host/Player)')

    arr(c, 68, H*0.80+4,  W*0.22-r, H*0.80+4, 'Credentials')
    arr(c, W*0.22+r, H*0.80, W*0.67-r, H*0.80, 'JWT + UserID')
    arr(c, W*0.67, H*0.80-r, W*0.67, H*0.40+r, 'Start Game')
    arr(c, W*0.22+r, H*0.40, W*0.67-r, H*0.40, 'Finalize Game')
    arr(c, W*0.22, H*0.80-r, W*0.22, H*0.40+r, 'Auth Socket')
    arr(c, W/2-50, H*0.58+10, W*0.22+r, H*0.40+15, '')
    arr(c, W*0.67-r, H*0.40-10, W/2+60, H*0.58+5, '')
    arr(c, W*0.67, H*0.40-r, W/2+65, H*0.19+20, 'Bulk Insert')
    arr(c, W/2-60, H*0.19+20, W*0.22+r, H*0.40-15, 'Read Quiz')

# ── 4. DFD Level 2 ──────────────────────────────────────────────────────────
def dfd2(c, W, H):
    c.setFont('Helvetica-Bold', 11); c.drawCentredString(W/2, H-14, 'DFD Level 2 — Game Engine (P3 Expanded)')
    c.setFont('Helvetica', 8); c.setFillColor(DGRAY)
    c.drawCentredString(W/2, H-26, 'Internal processes of the Socket.IO Game Service')
    c.setFillColor(BLACK)

    cx = W/2
    steps = [
        (cx, H-60,  'act', 'P3.1  Push game:questionStart\n(question + options + startTime)'),
        (cx, H-130, 'act', 'P3.2  Accept game:submitAnswer\n(validate within 15s window)'),
        (cx, H-205, 'dec', 'Answer\nCorrect?'),
        (cx, H-270, 'act', 'P3.3  Redis HINCRBY score\nHSET room:answers:{q}:{user}'),
        (cx, H-340, 'act', 'P3.4  Emit game:scoreUpdate\n(top-5 leaderboard to room)'),
        (cx, H-405, 'dec', '15s\nExpired?'),
        (cx, H-465, 'act', 'P3.5  Emit game:questionEnd\n(correct answer + leaderboard)'),
        (cx, H-530, 'dec', 'Last\nQuestion?'),
        (cx, H-585, 'act', 'P3.6  Call finalizeRoom HTTP\nBulk-persist Redis→PostgreSQL'),
    ]
    r_proc = 38
    r_dec  = 22

    def draw_step(s):
        sx, sy, st, sl = s
        if st == 'act':
            rbox(c, sx-135, sy-22, 270, 44, sl, fill=LGRAY, fs=8)
        elif st == 'dec':
            diam(c, sx, sy, 130, 42, sl, fs=8)

    for s in steps: draw_step(s)

    # connect vertically
    for i in range(len(steps)-1):
        sx, sy, st, sl = steps[i]
        _, ny, nst, _ = steps[i+1]
        y_from = sy-22 if st=='act' else sy-22
        y_to   = ny+22 if nst=='act' else ny+22
        arr(c, sx, y_from, sx, y_to)

    # No branches for decision diamonds
    # "Wrong answer" skip
    arr(c, cx+65, H-205, cx+160, H-205)
    arr(c, cx+160, H-205, cx+160, H-270)
    arr(c, cx+160, H-270, cx+135, H-270)
    c.setFont('Helvetica', 7); c.setFillColor(DGRAY)
    c.drawString(cx+67, H-202, 'No (wrong)')

    # "15s not expired" loop
    arr(c, cx+65, H-405, cx+165, H-405)
    arr(c, cx+165, H-405, cx+165, H-130)
    arr(c, cx+165, H-130, cx+135, H-130)
    c.drawString(cx+67, H-402, 'No (wait)')

    # "Not last question" loop back
    arr(c, cx+65, H-530, cx+175, H-530)
    arr(c, cx+175, H-530, cx+175, H-60)
    arr(c, cx+175, H-60, cx+135, H-60)
    c.drawString(cx+67, H-527, 'No (next Qs)')
    c.setFillColor(BLACK)

    # Redis on side
    datastore(c, 'D1: Redis', 8, H-295, 90, 22)
    arr(c, cx-135, H-270, 98, H-284, '')
    arr(c, 98, H-273, cx-135, H-260, '')

# ── 5. Use Case Diagram ──────────────────────────────────────────────────────
def use_case(c, W, H):
    c.setFont('Helvetica-Bold', 11); c.drawCentredString(W/2, H-14, 'Use Case Diagram')
    c.setFont('Helvetica', 8); c.setFillColor(DGRAY)
    c.drawCentredString(W/2, H-26, 'Actors: Host (creates/starts) and Player (joins/plays)')
    c.setFillColor(BLACK)

    # System boundary
    c.setStrokeColor(BLACK); c.setLineWidth(1); c.setFillColor(colors.HexColor('#FAFAFA'))
    c.rect(90, 30, W-180, H-72, fill=1, stroke=1)
    c.setFont('Helvetica-Bold', 9); c.setFillColor(BLACK)
    c.drawCentredString(W/2, H-46, '« System Boundary: QuizMaster Turbo »')

    stick(c, 'Host', 30, H/2-10)
    stick(c, 'Player', W-55, H/2-10)

    host_ucs = [
        (W/2-40, H-80,  'Register / Login'),
        (W/2-70, H-130, 'Create Quiz Room'),
        (W/2+50, H-130, 'View Lobby'),
        (W/2,    H-180, 'Start Game'),
        (W/2-60, H-230, 'View Results'),
    ]
    player_ucs = [
        (W/2,    H-280, 'Join Room (room code)'),
        (W/2-60, H-330, 'View Question'),
        (W/2+60, H-330, 'Submit Answer'),
        (W/2,    H-380, 'View Live Leaderboard'),
        (W/2,    H-425, 'Reconnect / game:sync'),
        (W/2,    H-470, 'View Final Results'),
    ]
    for ux, uy, ul in host_ucs + player_ucs:
        uc_oval(c, ux, uy, ul, rx=68, ry=12)

    # Host lines
    hx, hy = 55, H/2+28
    for ux, uy, _ in host_ucs:
        c.setStrokeColor(DGRAY); c.setLineWidth(0.4)
        c.line(hx, hy, ux-68, uy)

    # Player lines
    px_, py_ = W-55, H/2+28
    for ux, uy, _ in player_ucs:
        c.setStrokeColor(DGRAY); c.setLineWidth(0.4)
        c.line(px_, py_, ux+68, uy)

    # Both actors share Register/Login
    c.setStrokeColor(DGRAY); c.setLineWidth(0.4)
    c.line(hx, hy+10,  W/2-40-68, H-80)
    c.line(px_, py_+10, W/2-40+68, H-80)

# ── 6. Activity Diagram ──────────────────────────────────────────────────────
def activity(c, W, H):
    c.setFont('Helvetica-Bold', 11); c.drawCentredString(W/2, H-14, 'Activity Diagram — Game Round Lifecycle')
    c.setFont('Helvetica', 8); c.setFillColor(DGRAY)
    c.drawCentredString(W/2, H-26, 'Complete flow from question push to next question or finalization')
    c.setFillColor(BLACK)

    cx = W/2
    items = [
        (H-55,  'start', ''),
        (H-100, 'act',   'Server pushes game:questionStart\n(question + options + startTime timestamp)'),
        (H-160, 'act',   'Client calculates remaining time:\nelapsed=(Date.now()-startTime)/1000\nremaining=Math.ceil(Max(0, 15-elapsed))'),
        (H-225, 'act',   'Player clicks answer option\n→ Client locks buttons (isAnswered=true)\n→ emit game:submitAnswer'),
        (H-285, 'dec',   'Correct?'),
        (H-340, 'act',   'Redis HINCRBY room:{id}:scores userId\nRedis HSET room:{id}:answers:{q} userId → optionId\nemit game:answerResult { isCorrect, pointsEarned }'),
        (H-400, 'act',   'emit game:scoreUpdate to all room members\n(top-5 leaderboard with live scores)'),
        (H-450, 'dec',   '15s\nWindow?'),
        (H-505, 'act',   'emit game:questionEnd to all\n(correct answer + explanation + final leaderboard)'),
        (H-555, 'dec',   'Last\nQuestion?'),
        (H-605, 'act',   'Call finalizeRoom HTTP endpoint\nBulk-write Redis→PostgreSQL\nemit game:finished → clients redirect to /result'),
        (H-645, 'end',   ''),
    ]

    bh = {'act': 38, 'dec': 0}

    for sy, st, sl in items:
        if st == 'start':
            c.setFillColor(BLACK); c.circle(cx, sy, 10, fill=1, stroke=0)
        elif st == 'end':
            c.setFillColor(BLACK); c.circle(cx, sy, 10, fill=1, stroke=0)
            c.setFillColor(WHITE); c.circle(cx, sy, 7, fill=1, stroke=0)
            c.setFillColor(BLACK); c.circle(cx, sy, 4, fill=1, stroke=0)
        elif st == 'act':
            lines = sl.split('\n')
            h_ = 14 + len(lines)*13
            rbox(c, cx-140, sy-h_/2, 280, h_, sl, fill=LGRAY, fs=8)
        elif st == 'dec':
            diam(c, cx, sy, 120, 38, sl, fs=8)

    # connect
    prev = None
    for i, (sy, st, sl) in enumerate(items):
        if prev is not None:
            psy, pst, psl = prev
            if pst == 'start':
                arr(c, cx, psy-10, cx, sy+10 if st in ('dec',) else sy + (14+len(psl.split('\n'))*13)/2 - 0.01)
            elif pst == 'act':
                lines = psl.split('\n')
                h_ = 14 + len(lines)*13
                from_y = psy - h_/2
                if st == 'act':
                    lines2 = sl.split('\n'); h2 = 14+len(lines2)*13
                    arr(c, cx, from_y, cx, sy+h2/2)
                elif st == 'dec':
                    arr(c, cx, from_y, cx, sy+20)
                elif st == 'end':
                    arr(c, cx, from_y, cx, sy+10)
            elif pst == 'dec':
                if st == 'act':
                    lines2 = sl.split('\n'); h2 = 14+len(lines2)*13
                    arr(c, cx, psy-20, cx, sy+h2/2)
                    c.setFont('Helvetica', 7); c.setFillColor(DGRAY)
                    c.drawString(cx+3, (psy-20+sy+h2/2)/2+3, 'Yes')
                    c.setFillColor(BLACK)
                elif st == 'dec':
                    arr(c, cx, psy-20, cx, sy+20)
                    c.setFont('Helvetica', 7); c.setFillColor(DGRAY)
                    c.drawString(cx+3, (psy-20+sy+20)/2+3, 'Yes')
                    c.setFillColor(BLACK)
                elif st == 'end':
                    arr(c, cx, psy-20, cx, sy+10)
        prev = (sy, st, sl)

    # No-branch: Wrong answer (H-285 dec) → skip score, join at score update
    arr(c, cx+60, H-285, cx+155, H-285)
    arr(c, cx+155, H-285, cx+155, H-400)
    arr(c, cx+155, H-400, cx+140, H-400)
    c.setFont('Helvetica', 7); c.setFillColor(DGRAY); c.drawString(cx+62, H-282, 'No')

    # No-branch: 15s not expired → loop back to submit
    arr(c, cx+60, H-450, cx+170, H-450)
    arr(c, cx+170, H-450, cx+170, H-225)
    arr(c, cx+170, H-225, cx+140, H-225)
    c.drawString(cx+62, H-447, 'No (still open)')

    # No-branch: Not last question → loop to push next
    arr(c, cx+60, H-555, cx+180, H-555)
    arr(c, cx+180, H-555, cx+180, H-100)
    arr(c, cx+180, H-100, cx+140, H-100)
    c.drawString(cx+62, H-552, 'No (next Q)')
    c.setFillColor(BLACK)

# ── 7. Class Diagram (actual schema) ─────────────────────────────────────────
def class_diag(c, W, H):
    c.setFont('Helvetica-Bold', 11); c.drawCentredString(W/2, H-14, 'Class Diagram — Prisma Schema Models')
    c.setFont('Helvetica', 8); c.setFillColor(DGRAY)
    c.drawCentredString(W/2, H-26, 'All 10 models from the actual schema.prisma file')
    c.setFillColor(BLACK)

    def cls_box(name, fields, x, y, w=148):
        lh = 12
        h_ = 22 + len(fields)*lh + 4
        c.setFillColor(DGRAY); c.setStrokeColor(BLACK); c.setLineWidth(0.7)
        c.rect(x, y+h_-22, w, 22, fill=1, stroke=1)
        c.setFont('Helvetica-Bold', 8.5); c.setFillColor(WHITE)
        c.drawCentredString(x+w/2, y+h_-11, name)
        c.setFillColor(LGRAY); c.setStrokeColor(BLACK)
        c.rect(x, y, w, h_-22, fill=1, stroke=1)
        c.setFont('Courier', 7.2); c.setFillColor(BLACK)
        for i, f in enumerate(fields):
            c.drawString(x+5, y+(len(fields)-1-i)*lh+5, f)
        return x, y, w, h_

    # Left column
    cls_box('User', [
        'id: String @cuid PK',
        'username: String @unique',
        'firstName: String?',
        'lastName: String?',
        'email: String @unique',
        'password: String',
        'avatar: String',
        'createdAt: DateTime',
    ], 5, H-270, 155)

    cls_box('Category', [
        'id: String @uuid PK',
        'name: String @unique',
        'icon: String',
        'createdAt: DateTime',
    ], 5, H-370, 155)

    cls_box('Friend', [
        'id: String PK',
        'senderId: FK→User',
        'receiverId: FK→User',
        'status: FriendStatus',
        'createdAt: DateTime',
    ], 5, H-465, 155)

    cls_box('QuizAttempt', [
        'id: String PK',
        'userId: FK→User (nullable)',
        'quizId: FK→Quiz',
        'score/total: Int',
        'questions: Json',
        'timeTaken: Int',
        'guestId: String?',
    ], 5, H-590, 155)

    # Centre
    cls_box('Quiz', [
        'id: String @uuid PK',
        'quizNumber: Int',
        'title: String',
        'categoryId: FK→Category',
        'timeLimit: Int',
        'totalPoints: Int',
        'createdAt: DateTime',
    ], W/2-80, H-200, 160)

    cls_box('Question', [
        'id: String PK',
        'quizId: FK→Quiz',
        'questionText: String',
        'points: Int',
        'negativePoints: Int',
        'createdAt: DateTime',
    ], W/2-80, H-345, 160)

    cls_box('Option', [
        'id: String PK',
        'questionId: FK→Question',
        'text: String',
        'isCorrect: Boolean',
    ], W/2-80, H-450, 160)

    # Right column
    cls_box('Room', [
        'id: String PK',
        'roomName: String @unique',
        'quizId: FK→Quiz',
        'hostId: FK→User',
        'state: RoomState',
        'maxPlayers: Int',
        'startedAt/endedAt: DateTime?',
    ], W-165, H-255, 158)

    cls_box('RoomPlayer', [
        'id: String PK',
        'roomId: FK→Room',
        'userId: FK→User',
        'score/pointsEarned: Int',
        'usernameSnapshot: String',
        'hasJoinedGame: Boolean',
        'isHost: Boolean',
    ], W-165, H-410, 158)

    cls_box('RoomQuestion', [
        'id: String PK',
        'roomId: FK→Room',
        'questionId: String',
        'questionOrder: Int',
        'startedAt/endedAt: DateTime?',
    ], W-165, H-525, 158)

    cls_box('PlayerAnswer', [
        'id: String PK',
        'roomId: FK→Room',
        'roomQuestionId: FK→RQ',
        'userId: FK→User',
        'selectedOptionId: String',
        'isCorrect: Boolean',
        'pointsEarned: Int',
        'responseTimeMs: Int',
    ], W-165, H-670, 158)

    # relationship lines
    c.setStrokeColor(DGRAY); c.setLineWidth(0.5)
    # Category → Quiz
    c.line(160, H-320, W/2-80, H-168)
    # Quiz → Question
    c.line(W/2, H-200, W/2, H-280)
    c.line(W/2-80, H-345, W/2-80, H-323)
    # Question → Option
    c.line(W/2, H-345, W/2, H-388)
    c.line(W/2-80, H-450, W/2-80, H-428)
    # User → Quiz (author hidden for space)
    # User → Room
    c.line(160, H-200, W-165, H-200)
    # Room → RoomPlayer
    c.line(W-86, H-255, W-86, H-340)
    # Room → RoomQuestion
    c.line(W-120, H-255, W-120, H-460)
    # RoomQuestion → PlayerAnswer
    c.line(W-86, H-410, W-86, H-455)

    c.setFont('Helvetica', 7); c.setFillColor(DGRAY)
    c.drawString(W/2-28, H-215, '1→*')
    c.drawString(W/2-28, H-360, '1→*')
    c.drawString(W-158, H-315, '1→*')
    c.drawString(W-158, H-470, '1→*')
    c.drawString(W-158, H-540, '1→*')
    c.setFillColor(BLACK)

# ── 8. Sequence Diagram ──────────────────────────────────────────────────────
def sequence(c, W, H):
    c.setFont('Helvetica-Bold', 11); c.drawCentredString(W/2, H-14, 'Sequence Diagram — game:sync State Recovery')
    c.setFont('Helvetica', 8); c.setFillColor(DGRAY)
    c.drawCentredString(W/2, H-26, 'Player browser refresh / late join → full state restoration via single round trip')
    c.setFillColor(BLACK)

    lifelines = [(W*0.15,'Browser\n(Next.js)'), (W*0.50,'WS Server\n(Socket.IO)'), (W*0.82,'Redis')]
    top_y = H-55; bot_y = 30

    for lx, label in lifelines:
        lines = label.split('\n')
        h_ = 28 + len(lines)*12
        rbox(c, lx-55, top_y-h_+8, 110, h_, label, fill=LGRAY, fs=8, bold=True)
        c.setDash([4,3]); c.setStrokeColor(DGRAY); c.setLineWidth(0.6)
        c.line(lx, top_y-h_+8, lx, bot_y); c.setDash([])

    msgs = [
        (H-110, lifelines[0][0], lifelines[1][0], 's', 'Browser refresh / page load'),
        (H-145, lifelines[0][0], lifelines[1][0], 's', 'emit: game:join { roomId, userId }'),
        (H-180, lifelines[1][0], lifelines[2][0], 's', 'HGET room:{id}:scores userId'),
        (H-210, lifelines[2][0], lifelines[1][0], 'd', 'score: 42'),
        (H-240, lifelines[1][0], lifelines[2][0], 's', 'HGET room:{id}:meta'),
        (H-270, lifelines[2][0], lifelines[1][0], 'd', '{ questionIndex:3, startTime:1707..., currentQuestion }'),
        (H-300, lifelines[1][0], lifelines[2][0], 's', 'HGET room:{id}:answers:3 userId'),
        (H-330, lifelines[2][0], lifelines[1][0], 'd', 'previousAnswer: optionId (or null)'),
        (H-375, lifelines[1][0], lifelines[0][0], 'd', 'emit game:sync { gameState, question, timeLeft, startTime,\nscore, questionIndex, userAnswer }'),
        (H-435, lifelines[0][0], lifelines[0][0], 'self', 'Client reconstructs UI:\n• Render current question + options\n• Re-highlight previously selected answer\n• Recompute timer from shared startTime\n• Update score + question index display'),
    ]

    for my, x1, x2, mt, label in msgs:
        if mt == 'self':
            lines = label.split('\n')
            bh_ = 14 + len(lines)*11
            rbox(c, x1+8, my-bh_, 165, bh_, label, fill=LGRAY, fs=7.5)
        else:
            c.setDash([4,3] if mt=='d' else []); c.setStrokeColor(BLACK); c.setLineWidth(0.7)
            c.line(x1, my, x2, my); c.setDash([])
            dx = 1 if x2 > x1 else -1
            c.setFillColor(BLACK)
            p = c.beginPath()
            p.moveTo(x2, my); p.lineTo(x2-dx*7, my-4); p.lineTo(x2-dx*7, my+4); p.close()
            c.drawPath(p, fill=1, stroke=0)
            lines = label.split('\n')
            c.setFont('Helvetica', 7); c.setFillColor(DGRAY)
            mx = (x1+x2)/2
            for j, l in enumerate(lines):
                c.drawCentredString(mx, my+4-j*9, l)
            c.setFillColor(BLACK)

    # activation bars
    for lx, _ in lifelines[:2]:
        c.setFillColor(MGRAY); c.setStrokeColor(BLACK); c.setLineWidth(0.4)
        c.rect(lx-4, H-440, 8, 290, fill=1, stroke=1)

# ── 9. ER Diagram (actual schema) ────────────────────────────────────────────
def er_diag(c, W, H):
    c.setFont('Helvetica-Bold', 11); c.drawCentredString(W/2, H-14, 'Entity-Relationship Diagram')
    c.setFont('Helvetica', 8); c.setFillColor(DGRAY)
    c.drawCentredString(W/2, H-26, 'Based on actual Prisma schema — Room is aggregate root for a game session')
    c.setFillColor(BLACK)

    def ent(name, attrs, x, y, w=148):
        lh = 12
        h_ = 22 + len(attrs)*lh + 4
        c.setFillColor(DGRAY); c.setStrokeColor(BLACK); c.setLineWidth(0.7)
        c.rect(x, y+h_-22, w, 22, fill=1, stroke=1)
        c.setFont('Helvetica-Bold', 8); c.setFillColor(WHITE)
        c.drawCentredString(x+w/2, y+h_-11, name)
        c.setFillColor(LGRAY); c.setStrokeColor(BLACK)
        c.rect(x, y, w, h_-22, fill=1, stroke=1)
        c.setFont('Helvetica', 7.5); c.setFillColor(BLACK)
        for i, a in enumerate(attrs):
            prefix = '<b>' if a.startswith('PK') else ('<i>' if a.startswith('FK') else '')
            suffix = '</b>' if a.startswith('PK') else ('</i>' if a.startswith('FK') else '')
            c.drawString(x+5, y+(len(attrs)-1-i)*lh+5, a)
        return x, y, w, h_

    def rel_diam(label, cx_, cy_):
        c.setFillColor(WHITE); c.setStrokeColor(BLACK); c.setLineWidth(0.7)
        p = c.beginPath()
        p.moveTo(cx_, cy_+16); p.lineTo(cx_+40, cy_); p.lineTo(cx_, cy_-16); p.lineTo(cx_-40, cy_); p.close()
        c.drawPath(p, fill=1, stroke=1)
        c.setFont('Helvetica', 7); c.setFillColor(BLACK)
        c.drawCentredString(cx_, cy_-3, label)

    # Entities
    ent('USER', ['PK id: cuid', '   username (unique)', '   email (unique)', '   password', '   avatar', '   createdAt'], 5, H-215, 148)
    ent('CATEGORY', ['PK id: uuid', '   name (unique)', '   icon'], 5, H-330, 148)
    ent('QUIZ', ['PK id: uuid', 'FK categoryId→Category', '   quizNumber', '   title', '   timeLimit', '   totalPoints'], W/2-80, H-215, 160)
    ent('QUESTION', ['PK id: uuid', 'FK quizId→Quiz', '   questionText', '   points / negativePoints'], W/2-80, H-370, 160)
    ent('OPTION', ['PK id: uuid', 'FK questionId→Question', '   text', '   isCorrect: Boolean'], W/2-80, H-490, 160)
    ent('ROOM', ['PK id: uuid', 'FK quizId→Quiz', 'FK hostId→User', '   roomName (unique)', '   state: RoomState', '   maxPlayers'], W-165, H-215, 158)
    ent('ROOM_PLAYER', ['PK id: uuid', 'FK roomId→Room', 'FK userId→User', '   score / pointsEarned', '   isHost: Boolean', '   hasJoinedGame: Boolean'], W-165, H-400, 158)
    ent('ROOM_QUESTION', ['PK id: uuid', 'FK roomId→Room', '   questionId (ref)', '   questionOrder: Int', '   startedAt / endedAt'], W-165, H-540, 158)
    ent('PLAYER_ANSWER', ['PK id: uuid', 'FK roomId→Room', 'FK roomQuestionId→RQ', 'FK userId→User', '   selectedOptionId', '   isCorrect / pointsEarned', '   responseTimeMs'], W-165, H-690, 158)

    # Relationship diamonds
    rel_diam('belongs', 167, H-165)
    rel_diam('has', W/2-80+40, H-310)
    rel_diam('contains', W/2-80+40, H-425)
    rel_diam('hosts', W-165-40, H-165)
    rel_diam('has', W-165-40, H-330)

    # Lines
    c.setStrokeColor(DGRAY); c.setLineWidth(0.5)
    c.line(153, H-155, 167-40, H-165); c.line(167+40, H-165, W/2-80, H-165)
    c.line(5+148/2, H-330, 5+148/2, H-215)
    c.line(W/2-80+80, H-215, W/2-80+80, H-310+16)
    c.line(W/2-80+80, H-310-16, W/2-80+80, H-370+60)
    c.line(W/2-80+80, H-370, W/2-80+80, H-425+16)
    c.line(W/2-80+80, H-425-16, W/2-80+80, H-490+50)
    c.line(W-165+79, H-215, W-165-40, H-165)
    c.line(W-165+79, H-215, W-165+79, H-330+16)
    c.line(W-165+79, H-330-16, W-165+79, H-400+72)
    c.line(W-165+79, H-400, W-165+79, H-430)
    c.line(W-165+79, H-540+68, W-165+79, H-570)
    c.line(W-165+79, H-690+94, W-165+79, H-720)

    c.setFont('Helvetica', 7); c.setFillColor(DGRAY)
    c.drawString(W-165+82, H-365, '1→N')
    c.drawString(W-165+82, H-510, '1→N')
    c.drawString(W-165+82, H-650, '1→N')
    c.drawString(W/2-78, H-348, '1→N')
    c.drawString(W/2-78, H-468, '1→N')
    c.setFillColor(BLACK)

# ── 10. Flowchart ─────────────────────────────────────────────────────────────
def flowchart(c, W, H):
    c.setFont('Helvetica-Bold', 11); c.drawCentredString(W/2, H-14, 'Flow Chart — Room & Lobby Lifecycle')
    c.setFont('Helvetica', 8); c.setFillColor(DGRAY)
    c.drawCentredString(W/2, H-26, 'From host creating a room to the game engine taking control')
    c.setFillColor(BLACK)

    cx = W/2
    def term(label, y):
        c.setFillColor(DGRAY); c.setStrokeColor(BLACK); c.setLineWidth(0.7)
        c.roundRect(cx-95, y-14, 190, 28, 14, fill=1, stroke=1)
        c.setFont('Helvetica-Bold', 9); c.setFillColor(WHITE)
        c.drawCentredString(cx, y-1, label)

    def proc(label, y, w=260):
        c.setFillColor(LGRAY); c.setStrokeColor(BLACK); c.setLineWidth(0.7)
        c.rect(cx-w/2, y-14, w, 28, fill=1, stroke=1)
        c.setFont('Helvetica', 8.5); c.setFillColor(BLACK)
        c.drawCentredString(cx, y-1, label)

    def dec(label, y):
        diam(c, cx, y, 160, 42, label, fs=8)

    steps = [
        (H-55,  'term', 'START'),
        (H-100, 'proc', 'Host: POST /api/room  →  Room record in PostgreSQL (state=CREATED)'),
        (H-145, 'proc', 'System generates unique roomName  →  Host shares to players'),
        (H-190, 'proc', 'Players call POST /api/room/join with roomName'),
        (H-235, 'proc', 'Redis HSET room:{id}:players  userId → { username, avatar }'),
        (H-278, 'dec',  'Enough\nPlayers?'),
        (H-338, 'proc', 'Host emits lobby:startGame  →  Backend startRoom controller fires'),
        (H-383, 'proc', 'Bulk INSERT: Redis players → PostgreSQL RoomPlayer table (Prisma createMany)'),
        (H-428, 'proc', 'Create RoomQuestion records (empty result containers) in PostgreSQL'),
        (H-473, 'proc', 'Update Room.state = PLAYING in PostgreSQL'),
        (H-518, 'proc', 'emit lobby:startingRoom to all sockets in the room'),
        (H-563, 'proc', 'Clients: router.replace("/room/{id}/game") — no back-button loop'),
        (H-610, 'term', 'END — Game Engine (Socket.IO WS) Takes Over'),
    ]

    for y, st, sl in steps:
        if st == 'term': term(sl, y)
        elif st == 'proc': proc(sl, y)
        elif st == 'dec': dec(sl, y)

    for i in range(len(steps)-1):
        y1, st1, _ = steps[i]
        y2, st2, _ = steps[i+1]
        if st1 == 'term':   arr(c, cx, y1-14, cx, y2+14)
        elif st1 == 'proc':
            if st2 == 'proc': arr(c, cx, y1-14, cx, y2+14)
            elif st2 == 'dec': arr(c, cx, y1-14, cx, y2+22)
            else:             arr(c, cx, y1-14, cx, y2-14)
        elif st1 == 'dec':
            if st2 == 'proc': arr(c, cx, y1-22, cx, y2+14); c.setFont('Helvetica',7); c.setFillColor(DGRAY); c.drawString(cx+3, (y1-22+y2+14)/2+3,'Yes'); c.setFillColor(BLACK)
            else:             arr(c, cx, y1-22, cx, y2-14)

    # No branch on "Enough Players?" - loop back
    c.setStrokeColor(BLACK); c.setLineWidth(0.7)
    c.line(cx+80, H-278, cx+155, H-278)
    c.line(cx+155, H-278, cx+155, H-235)
    arr(c, cx+155, H-235, cx+130, H-235)
    c.setFont('Helvetica',7); c.setFillColor(DGRAY)
    c.drawString(cx+82, H-275, 'No (wait)'); c.setFillColor(BLACK)

# ═══════════════════════════════════════════════════════════════════════════
#  PAGE CALLBACK
# ═══════════════════════════════════════════════════════════════════════════
def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8); canvas.setFillColor(DGRAY)
    canvas.drawString(2*cm, 18, 'Vishal Nishad  ·  O24MCA110487')
    canvas.drawRightString(A4[0]-2*cm, 18, f'QuizMaster Turbo  ·  Page {doc.page}')
    canvas.setStrokeColor(MGRAY); canvas.setLineWidth(0.4)
    canvas.line(2*cm, 24, A4[0]-2*cm, 24)
    canvas.restoreState()

# ═══════════════════════════════════════════════════════════════════════════
#  STORY BUILD
# ═══════════════════════════════════════════════════════════════════════════
story = []
add = story.append
ext = story.extend

# helper for screenshot placeholder
def ss_placeholder(title, sub='', w=14.5*cm, h=8*cm, cap=''):
    def _draw(c, W, H):
        c.setFillColor(LGRAY); c.setStrokeColor(MGRAY); c.setLineWidth(0.7)
        c.roundRect(2, 2, W-4, H-4, 5, fill=1, stroke=1)
        # browser bar
        c.setFillColor(MGRAY); c.setStrokeColor(MGRAY)
        c.roundRect(2, H-28, W-4, 26, 5, fill=1, stroke=0)
        c.rect(2, H-18, W-4, 10, fill=1, stroke=0)
        for i, col in enumerate([colors.HexColor('#FF5F57'), colors.HexColor('#FEBC2E'), colors.HexColor('#28C840')]):
            c.setFillColor(col); c.circle(18+i*16, H-17, 4.5, fill=1, stroke=0)
        c.setFillColor(WHITE); c.setStrokeColor(MGRAY); c.setLineWidth(0.4)
        c.roundRect(60, H-24, W-70, 14, 3, fill=1, stroke=1)
        c.setFont('Helvetica', 7); c.setFillColor(BGRAY)
        c.drawString(68, H-19, 'localhost:3000/quizMaster ...')
        # content
        c.setFont('Helvetica-Bold', 12); c.setFillColor(DGRAY)
        c.drawCentredString(W/2, H/2+14, title)
        c.setFont('Helvetica', 9); c.setFillColor(BGRAY)
        if sub: c.drawCentredString(W/2, H/2-2, sub)
        c.setFont('Helvetica', 7.5)
        c.drawCentredString(W/2, H/2-18, '[Screenshot — insert actual app screenshot here]')
        c.setDash([5,4]); c.setStrokeColor(BGRAY); c.setLineWidth(0.4)
        c.rect(20, 20, W-40, H-54, fill=0, stroke=1); c.setDash([])
    items = [Diag(_draw, w, h)]
    if cap: items += [SP(3), P(f'<i>{cap}</i>', caption_s)]
    return items

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# COVER PAGE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
add(SP(50))
add(P('QuizMaster Turbo', cover_title))
add(P('Real-Time Multiplayer Quiz Platform', cover_sub))
add(SP(8)); add(HR()); add(SP(12))
add(P('Submitted in partial fulfillment of the requirements for the award of the degree of', center_s))
add(P('<b>Master of Computer Applications (MCA)</b>', center_s))
add(SP(20))
cover_info = [
    ['Student Name:',    'Vishal Nishad'],
    ['Enrollment No:',   'O24MCA110487'],
    ['Program:',         'MCA — 2024'],
    ['Guide / Mentor:',  'Suruchi'],
    ['Institution:',     'Chandigarh University Online'],
    ['Academic Year:',   '2025–26'],
    ['Date:',            'June 2026'],
    ['GitHub:',          'github.com/MrSanito/quizMasterTurbo'],
]
ct = Table([[P(k, bold_s), P(v, body_l)] for k,v in cover_info], colWidths=[4.5*cm, 10*cm])
ct.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
add(ct); add(PB())

# DECLARATION
add(H1('DECLARATION')); add(HR()); add(SP(6))
add(P('I, <b>Vishal Nishad</b>, hereby solemnly declare that the project report titled <b>"QuizMaster Turbo — Real-Time Multiplayer Quiz Platform"</b> submitted in partial fulfillment of the requirements for the award of the degree of Master of Computer Applications (MCA) is my original work.'))
add(SP(6)); add(P('I further declare that:'))
add(B('This project was carried out during the academic year 2025–26 under the supervision of <b>Suruchi</b>.'))
add(B('The work has not been submitted previously to any other university, institution, or examination body for the award of any degree, diploma, or certification.'))
add(B('All sources of information used in this report have been duly acknowledged and referenced in accordance with academic ethics and plagiarism norms.'))
add(B('The data presented in this report is authentic to the best of my knowledge and has not been fabricated or manipulated.'))
add(B('I understand that if any part of this declaration is found to be false, my project may be rejected and disciplinary action may be taken as per institutional rules.'))
add(SP(25))
add(P('Place: Vadodara')); add(P('Date: ____________________')); add(SP(20))
dec_t = Table([[P('Student Signature:',bold_s), P('____________________', body_l)],[P('Student Name:',bold_s),P('Vishal Nishad',body_l)],[P('Enrollment No:',bold_s),P('O24MCA110487',body_l)]], colWidths=[5*cm, 9*cm])
dec_t.setStyle(TableStyle([('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
add(dec_t); add(PB())

# ACKNOWLEDGEMENT
add(H1('Acknowledgement')); add(HR()); add(SP(6))
for para in [
    'I would like to express my sincere gratitude to my respected mentor, <b>Suruchi</b>, for constant guidance, valuable suggestions, and continuous encouragement throughout the completion of this project titled <i>"QuizMaster Turbo — Real-Time Multiplayer Quiz Platform."</i> Their expertise, patience, and insightful feedback played a crucial role in helping me understand the project requirements and successfully implement the system.',
    'I would also like to extend my heartfelt thanks to all the faculty members of Chandigarh University for their guidance, support, and encouragement during my academic journey. Their teachings and practical knowledge provided a strong foundation that helped me carry out this project effectively.',
    'I am grateful to Chandigarh University Online for providing a supportive learning environment and the necessary academic resources. The university\'s focus on practical, project-based learning was highly beneficial in developing my technical and analytical abilities as a full-stack developer.',
    'I also thank the open-source communities behind Socket.IO, Prisma, Turborepo, Redis, and Next.js, whose well-documented tools made this project technically possible. Finally, I express my deep gratitude to my friends and family for their unwavering motivation and support throughout this journey.',
]:
    add(P(para)); add(SP(6))
add(SP(16))
add(P('Submitted for the project viva-voce examination held on ____________________'))
add(PB())

# TABLE OF CONTENTS
add(H1('Table of Contents')); add(HR()); add(SP(10))
toc_entries = [
    ('Abstract', '5'),
    ('Chapter 1: Introduction', '6'),
    ('  1.1 Background of the Project', '6'),
    ('  1.2 Problem Statement', '7'),
    ('  1.3 Objectives of the System', '7'),
    ('  1.4 Scope of the Project', '8'),
    ('  1.5 Existing System Overview', '8'),
    ('  1.6 Proposed System Overview', '9'),
    ('  1.7 Technologies Used', '9'),
    ('Chapter 2: Literature Review / System Study', '11'),
    ('  2.1 Introduction', '11'),
    ('  2.2 Review of Similar Systems', '11'),
    ('  2.3 Comparative Analysis', '12'),
    ('  2.4 Software Development Models', '13'),
    ('  2.5 Frameworks and Libraries Used', '13'),
    ('  2.6 Research Gap', '15'),
    ('Chapter 3: System Analysis', '16'),
    ('  3.1 Introduction', '16'),
    ('  3.2 Functional Requirements', '16'),
    ('  3.3 Non-Functional Requirements', '17'),
    ('  3.4 User Requirements', '18'),
    ('  3.5 Feasibility Study', '18'),
    ('  3.6 System Architecture Diagram', '19'),
    ('  3.7 Data Flow Diagrams (Level 0, 1, 2)', '20'),
    ('  3.8 Use Case Diagram / Descriptions', '22'),
    ('  3.9 Database Design (Class / Entity-Relationship Diagrams)', '23'),
    ('Chapter 4: System Design', '25'),
    ('  4.1 Activity Diagram', '25'),
    ('  4.2 Sequence Diagram', '26'),
    ('  4.3 Flowchart', '27'),
    ('  4.4 Detailed Schema Specification', '28'),
    ('Chapter 5: Implementation & Testing', '29'),
    ('  5.1 System Specifications (Hardware & Software)', '29'),
    ('  5.2 Implementation Highlights', '29'),
    ('  5.3 Testing Methodologies', '30'),
    ('Chapter 6: Conclusion & Future Scope', '31'),
    ('  6.1 Summary of Findings', '31'),
    ('  6.2 Limitations of the System', '31'),
    ('  6.3 Future Enhancements', '31'),
    ('Bibliography / References', '32'),
]

toc_rows = []
for label, pg in toc_entries:
    toc_rows.append([P(label, toc_s), P(pg, toc_pg)])
toc_t = Table(toc_rows, colWidths=[12.5*cm, 2*cm])
toc_t.setStyle(TableStyle([
    ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
    ('BOTTOMPADDING', (0,0), (-1,-1), 1),
    ('TOPPADDING', (0,0), (-1,-1), 1),
]))
add(toc_t)
add(PB())

# ABSTRACT
add(H1('ABSTRACT')); add(HR()); add(SP(10))
add(P('QuizMaster Turbo is a cutting-edge, real-time multiplayer quiz platform designed to deliver high-performance, synchronous, and interactive learning experiences. Traditional online quiz systems suffer from latency, polling overhead, and poor scalability, resulting in sub-optimal user experiences during live multiplayer sessions. This project addresses these challenges by implementing a state-of-the-art three-tier architecture utilizing a Node.js and Socket.IO backend, Next.js (React) on the frontend, and a dual-database persistence model comprising Redis and PostgreSQL.'))
add(SP(8))
add(P('The system employs a "Hybrid Reality" data access pattern, where real-time, volatile game states (such as active lobbies, player connections, live scores, and mid-round answer submissions) are handled in-memory using Redis, while durable datasets (such as user credentials, categories, quiz definitions, attempts, and historical reports) are persisted in PostgreSQL via the Prisma ORM. Live synchronization during player reconnections is facilitated by a custom Socket.IO state-recovery handshake protocol (game:sync), ensuring that players can seamlessly resume active games without data loss. The application is built as a monorepo managed by Turborepo, optimizing the build pipeline, dependency management, and sharing of common TypeScript interfaces between services.'))
add(SP(8))
add(P('This report presents the complete system analysis, software engineering model, architectural design, database schemas, sequence diagrams, activity diagrams, and deployment considerations for QuizMaster Turbo. Verification has been carried out via comprehensive unit and load testing, proving the system\'s capability to handle concurrent multiplayer sessions with low-latency updates.'))
add(PB())

# CHAPTER 1
add(H1('Chapter 1: Introduction')); add(HR()); add(SP(10))
add(H2('1.1 Background of the Project'))
add(P('In recent years, gamified learning platforms have transformed education and corporate training by turning traditional testing into interactive, multiplayer contests. Platforms like Kahoot! and Quizizz have demonstrated the power of gamification in increasing participant engagement, retention, and satisfaction. At the core of these platforms is the requirement for real-time synchronization: when a quiz host starts a question, all participating players must receive the question options simultaneously, see a synchronous countdown timer, and view immediate leaderboard updates upon answering.'))
add(SP(6))
add(P('Developing such platforms requires addressing complex web engineering problems. Traditional HTTP request-response patterns (like short or long polling) are inefficient and generate massive overhead on servers. Modern real-time applications require bidirectional, persistent connections where servers can push updates instantly to thousands of clients. QuizMaster Turbo was conceived to explore and implement modern web sockets and in-memory data structures to solve the real-time multiplayer challenge efficiently.'))
add(SP(10))

add(H2('1.2 Problem Statement'))
add(P('Existing real-time quiz systems face several critical challenges:'))
add(B('<b>High Latency:</b> Traditional HTTP-based polling introduces significant latency, preventing real-time synchronization of timers and leaderboards.'))
add(B('<b>Server Overhead:</b> Maintaining thousands of active polling requests consumes server memory and CPU cycles rapidly, limiting scalability.'))
add(B('<b>Connection Instability:</b> Players on mobile networks frequently experience disconnections. Without robust state recovery, a disconnected player loses their session, score, and active game progress.'))
add(B('<b>Database Bottlenecks:</b> Writing every single answer submission and score update directly to a relational database creates extreme disk I/O bottlenecks under high concurrency.'))
add(SP(10))

add(H2('1.3 Objectives of the System'))
add(P('The primary objectives of the QuizMaster Turbo system are:'))
add(B('<b>Real-time Communication:</b> Establish low-latency, bidirectional connections between client and server using WebSockets (Socket.IO).'))
add(B('<b>High Scalability:</b> Implement a dual-database model using Redis for volatile, high-speed operations and PostgreSQL for durable persistence.'))
add(B('<b>State Recovery:</b> Create a robust reconnection protocol (game:sync) to allow players to resume active quiz sessions after a network dropout.'))
add(B('<b>Monorepo Architecture:</b> Utilize Turborepo to manage frontend and backend code, sharing schemas and TypeScript types seamlessly.'))
add(B('<b>Comprehensive Analytics:</b> Provide host and student dashboards with detailed performance analytics.'))
add(PB())

# CHAPTER 1 - Continued
add(H2('1.4 Scope of the Project'))
add(P('The scope of this project includes the design, development, and testing of the QuizMaster Turbo multiplayer platform. Specifically, the system covers user authentication and profile management, quiz creation and category organization by hosts, live room lobby management with unique room codes, real-time question delivery and answer validation, live score calculation and top-5 leaderboard broadcasts, data migration from Redis to PostgreSQL upon game completion, and graphical report generation of user attempts. The scope excludes video streaming within the app, payment gateways for premium tiers, and SMS-based room invite codes, focusing strictly on high-performance web-based multiplayer synchronization.'))
add(SP(10))

add(H2('1.5 Existing System Overview'))
add(P('Traditional online testing applications operate on a standard request-response model:'))
add(B('<b>HTTP Architecture:</b> Clients make periodic requests to the server to fetch game status, lobby players, or active questions.'))
add(B('<b>Lack of Live Leaderboards:</b> Scores are calculated at the very end of the test, removing the competitive element of live leaderboards.'))
add(B('<b>No Reconnection Handling:</b> If a page refreshes, the quiz session is destroyed, forcing the user to restart from the beginning.'))
add(B('<b>Relational Persistence Only:</b> High-frequency updates (e.g., ticking timers and option selections) write directly to SQL tables, causing database locks and system crashes under load.'))
add(SP(10))

add(H2('1.6 Proposed System Overview'))
add(P('QuizMaster Turbo addresses these limitations by introducing a real-time, memory-optimized architecture:'))
add(B('<b>Persistent WebSockets:</b> Bidirectional communication using Socket.IO allows the server to push questions and leaderboard updates instantly.'))
add(B('<b>In-Memory Caching (Redis):</b> Volatile data like lobbies, timers, and mid-game scores are stored in Redis using fast key-value operations.'))
add(B('<b>Durable Relational Store (PostgreSQL):</b> Relational records (user accounts, quizzes) are persisted in PostgreSQL via Prisma ORM.'))
add(B('<b>State Sync Handshake:</b> A specialized sync handler queries Redis on socket reconnection and sends the player\'s current state back to the UI.'))
add(SP(10))

add(H2('1.7 Technologies Used'))
add(P('The project utilizes a modern full-stack JavaScript/TypeScript ecosystem:'))
add(B('<b>Frontend:</b> Next.js 14 (React) utilizing Tailwind CSS for responsive UI, Lucide-React for iconography, and Axios for HTTP requests.'))
add(B('<b>Backend:</b> Node.js with Express.js for REST APIs and Socket.IO for the real-time event-driven game engine.'))
add(B('<b>Database Tier:</b> Redis (ioredis client) for real-time memory caching and PostgreSQL (Neon Serverless / Local Docker) for data storage.'))
add(B('<b>ORM & Build Tools:</b> Prisma ORM for database migrations and type-safe queries; Turborepo for monorepo workspace orchestration.'))
add(PB())

# CHAPTER 2
add(H1('Chapter 2: Literature Review / System Study')); add(HR()); add(SP(10))
add(H2('2.1 Introduction'))
add(P('To build a competitive multiplayer quiz system, it is vital to review existing systems, methodologies, and technologies in the industry. This literature review evaluates dominant platforms like Kahoot! and Quizizz, analyzes the underlying technologies used for real-time communication, and assesses the suitability of various software development methodologies (such as Agile and Waterfall) for interactive web applications.'))
add(SP(10))

add(H2('2.2 Review of Similar Systems'))
add(P('<b>Kahoot!:</b> Kahoot! is a pioneer in game-based classroom response systems. It operates on a shared-screen model where questions are shown on a central projector (controlled by the host) and players select color-coded options on their individual devices. This creates high engagement but requires all participants to be in the same physical room or viewing a video stream. Its backend uses WebSockets to broadcast room states.'))
add(SP(6))
add(P('<b>Quizizz:</b> Quizizz offers self-paced multiplayer quizzes where questions are shown on the student\'s screen directly, making it suitable for remote asynchronous or synchronous play. It uses live leaderboards and memes to keep players engaged. The architecture relies heavily on real-time event broadcasting and database sharding to handle peak classroom hours.'))
add(SP(10))

add(H2('2.3 Comparative Analysis'))
add(P('The following table summarizes the comparison between existing systems and the proposed QuizMaster Turbo:'))
add(SP(6))
headers = [P('Feature', bold_s), P('Kahoot!', bold_s), P('Quizizz', bold_s), P('QuizMaster Turbo', bold_s)]
rows_data = [
    [P('Real-Time Engine'), P('WebSockets (Faye)'), P('WebSockets / Polling'), P('Socket.IO (WebSockets + Fallback)')],
    [P('Data Persistence'), P('Durable Database'), P('Durable Database'), P('Hybrid (Redis Cache + PostgreSQL)')],
    [P('Screen Dependency'), P('Requires Shared Screen'), P('Self-Paced Screen'), P('Dual Mode (Self/Shared Screen)')],
    [P('State Recovery'), P('Partial (fails on reload)'), P('Session Cookies'), P('Socket.IO game:sync Handshake')],
    [P('Monorepo Support'), P('Proprietary / Polyrepo'), P('Polyrepo'), P('Turborepo (Single Repository)')]
]
add(std_table(headers, rows_data, [4*cm, 3.5*cm, 3.5*cm, 4.5*cm]))
add(SP(10))
add(PB())

# CHAPTER 2 - Continued
add(H2('2.4 Software Development Models'))
add(P('For a high-interaction application like QuizMaster Turbo, the <b>Agile Scrum Methodology</b> was selected over the traditional Waterfall model. Real-time features, socket connections, and database synchronization require continuous integration, user feedback, and iterative refinement. Development was broken down into two-week sprints:'))
add(B('<b>Sprint 1 (Foundations):</b> Monorepo configuration, Prisma schema definitions, PostgreSQL connection setup, and user authentication API.'))
add(B('<b>Sprint 2 (Lobby & Room):</b> Lobbies API, unique room code generation, socket room joining, and Redis data structure mappings.'))
add(B('<b>Sprint 3 (Game Engine):</b> WebSocket game loops, question broadcasting, synchronized 15-second timers, and live leaderboard events.'))
add(B('<b>Sprint 4 (State Sync & Persistence):</b> Reconnection logic (game:sync), database migration from Redis to PostgreSQL, and report PDF generation.'))
add(SP(10))

add(H2('2.5 Frameworks and Libraries Used'))
add(P('The selection of tools was guided by performance and developer velocity:'))
add(B('<b>Next.js & React:</b> Next.js provides file-based routing, server-side rendering (SSR), and highly reactive state management suitable for live game UI.'))
add(B('<b>Socket.IO:</b> Unlike raw WebSockets, Socket.IO provides automatic reconnection, packet buffering, heartbeats, and room abstraction natively.'))
add(B('<b>Redis:</b> Storing active lobby players in Redis hashes allows constant-time read/write operations (O(1)), bypassing relational table joins.'))
add(B('<b>Prisma ORM:</b> Auto-generated TypeScript types based on schema.prisma ensure type safety during database operations, preventing runtime query errors.'))
add(SP(10))

add(H2('2.6 Research Gap'))
add(P('While commercial platforms excel at scalability, their underlying source code and architectural patterns are proprietary. Open-source implementations often compromise on either real-time speed (using slow databases like MySQL directly for sockets) or session resilience (players losing progress on reload). QuizMaster Turbo bridges this gap by providing an open-source, resilient, high-speed architecture using a structured Redis caching layer coupled with a robust socket state recovery engine.'))
add(PB())

# CHAPTER 3
add(H1('Chapter 3: System Analysis')); add(HR()); add(SP(10))
add(H2('3.1 Introduction'))
add(P('System analysis involves determining the functional and non-functional requirements, identifying user needs, evaluating feasibility, and modeling data flows. This phase ensures that the technical architecture aligns with performance requirements and business rules.'))
add(SP(10))

add(H2('3.2 Functional Requirements'))
add(P('The core functional capabilities of the system are categorized by module:'))
add(B('<b>Authentication:</b> User registration, secure password hashing (bcrypt), JWT generation, and middleware verification.'))
add(B('<b>Quiz Creator:</b> Interface for creators to write questions, set options, specify the correct answer, and choose categories.'))
add(B('<b>Lobby Manager:</b> Unique 6-character room code generation, active player lists, and real-time player list updates via websockets.'))
add(B('<b>Real-time Game Loop:</b> Automatic 15-second countdown timers, synchronized question pushing, and live mid-game leaderboards.'))
add(B('<b>Reconnection Handler:</b> Session restore via token lookup in Redis, sending current question state and elapsed time back to the user.'))
add(B('<b>Result Engine:</b> Migrating score results from Redis into PostgreSQL at room end, compiling individual dashboards.'))
add(SP(10))

add(H2('3.3 Non-Functional Requirements'))
add(P('Non-functional constraints outline performance, reliability, and security metrics:'))
add(B('<b>Performance:</b> Question delivery latency must be under 200 milliseconds. Scoring calculations must complete in under 50 milliseconds.'))
add(B('<b>Scalability:</b> The server must sustain 500 concurrent socket connections per room without degradation.'))
add(B('<b>Resilience:</b> Reconnections within 15 seconds must restore the player\'s game UI state without losing accumulated score.'))
add(B('<b>Security:</b> Sensitive database values must be hashed. Sockets must require valid JWT handshakes before joining room channels.'))
add(SP(10))

add(H2('3.4 User Requirements'))
add(P('Users interact with the platform in two distinct roles:'))
add(B('<b>Lobby Hosts (Creators):</b> Require tools to create quizzes, configure time limits, start active games, and review final scoreboard analytics.'))
add(B('<b>Lobby Players (Participants):</b> Require an intuitive responsive interface to join rooms via code, view active questions, select options, see live leaderboard rankings, and view detailed analysis of their answers.'))
add(PB())

# CHAPTER 3 - Continued
add(H2('3.5 Feasibility Study'))
add(P('A feasibility study was conducted across three dimensions:'))
add(B('<b>Technical Feasibility:</b> The development team is proficient in JavaScript/TypeScript. Next.js, Node.js, and Socket.IO are industry standards with mature ecosystems, confirming high technical feasibility.'))
add(B('<b>Operational Feasibility:</b> QuizMaster Turbo is simple to operate. Lobbies are created with a single click, and players join using basic codes, making the platform accessible to schools and corporate offices.'))
add(B('<b>Economic Feasibility:</b> By hosting PostgreSQL on serverless tiers (Neon) and Redis on managed cloud endpoints (Upstash/Docker), operational costs remain minimal, proving economic viability.'))
add(SP(15))

add(H2('3.6 System Architecture Diagram'))
add(P('The system architecture diagram illustrates the multi-tier design of the platform:'))
add(SP(6))
ext(diag(arch_diag, w=15.5*cm, h=10.5*cm, cap='Figure 3.1: Three-Tier System Architecture (Presentation, Application, and Data Tier)'))
add(PB())

# CHAPTER 3 - DFD
add(H2('3.7 Data Flow Diagrams (Level 0, 1, 2)'))
add(P('Data Flow Diagrams (DFDs) trace the movement of information through the system, from external entities (User/Host) into process modules and persistence data stores.'))
add(SP(6))
ext(diag(dfd0, w=15.5*cm, h=10*cm, cap='Figure 3.2: DFD Level 0 (Context Diagram) showing QuizMaster Turbo process boundaries'))
add(SP(10))
add(PB())

add(P('The DFD Level 1 decomposes the context diagram into four major processes: Authentication (P1), Room/Lobby Management (P2), Game Engine (P3), and Result Persistence (P4).'))
add(SP(6))
ext(diag(dfd1, w=15.5*cm, h=10.5*cm, cap='Figure 3.3: DFD Level 1 (Major Subsystems and Inter-Process Data Flow)'))
add(PB())

add(P('The DFD Level 2 zooms into the Game Engine (P3) process, outlining the detailed logic of the websocket event-loop, answer verification, Redis scoring, and final data migration.'))
add(SP(6))
ext(diag(dfd2, w=15.5*cm, h=11*cm, cap='Figure 3.4: DFD Level 2 (Game Engine Loop details showing Redis updates)'))
add(PB())

# CHAPTER 3 - Use Cases
add(H2('3.8 Use Case Diagram / Descriptions'))
add(P('The Use Case Diagram displays relationships between external users (Host and Player) and the operations within the system boundary.'))
add(SP(6))
ext(diag(use_case, w=15.5*cm, h=11*cm, cap='Figure 3.5: Use Case Diagram for Host and Player Roles'))
add(PB())

# CHAPTER 3 - Database Design
add(H2('3.9 Database Design (Class / Entity-Relationship Diagrams)'))
add(P('The Class Diagram details the object-oriented structure of the Prisma models matching the database relational schemas.'))
add(SP(6))
ext(diag(class_diag, w=15.5*cm, h=12.5*cm, cap='Figure 3.6: UML Class Diagram representing Prisma schema models'))
add(PB())

add(P('The Entity-Relationship Diagram (ERD) defines tables, fields, constraints, primary keys (PK), foreign keys (FK), and cardinalities (1-to-N relationships).'))
add(SP(6))
ext(diag(er_diag, w=15.5*cm, h=12.5*cm, cap='Figure 3.7: Entity-Relationship Diagram representing PostgreSQL relational tables'))
add(PB())

# CHAPTER 4
add(H1('Chapter 4: System Design')); add(HR()); add(SP(10))
add(H2('4.1 Activity Diagram'))
add(P('The Activity Diagram maps the dynamic, event-driven lifecycle of a quiz round, modeling actions from the initial question push to timer expiration and next question transitions.'))
add(SP(6))
ext(diag(activity, w=15.5*cm, h=12.5*cm, cap='Figure 4.1: Activity Diagram representing the Game Round Lifecycle'))
add(PB())

# CHAPTER 4 - Sequence Diagram
add(H2('4.2 Sequence Diagram'))
add(P('The Sequence Diagram details the exact timeline of the state recovery (game:sync) handshake, showing the messages passed between Browser, WS Server, and Redis cache.'))
add(SP(6))
ext(diag(sequence, w=15.5*cm, h=11*cm, cap='Figure 4.2: Sequence Diagram for game:sync State Recovery Handshake'))
add(PB())

add(H2('4.3 Flowchart'))
add(P('The Flowchart outlines the logical steps involved in room creation, player joining, and transition into active gameplay.'))
add(SP(6))
ext(diag(flowchart, w=15.5*cm, h=12*cm, cap='Figure 4.3: Flow Chart representing the Room & Lobby Lifecycle'))
add(PB())

add(H2('4.4 Detailed Schema Specification'))
add(P('Below is the relational mapping of the primary models defined in the database schema:'))
add(SP(6))
headers_schema = [P('Table Name', bold_s), P('Primary Key (PK)', bold_s), P('Foreign Keys (FK)', bold_s), P('Key Attributes', bold_s)]
rows_schema = [
    [P('User'), P('id (cuid)'), P('None'), P('username, email, password, avatar, createdAt')],
    [P('Quiz'), P('id (uuid)'), P('categoryId'), P('quizNumber, title, timeLimit, totalPoints')],
    [P('Question'), P('id (uuid)'), P('quizId'), P('questionText, points, negativePoints')],
    [P('Room'), P('id (uuid)'), P('quizId, hostId'), P('roomName, state, maxPlayers, startedAt')],
    [P('RoomPlayer'), P('id (uuid)'), P('roomId, userId'), P('score, pointsEarned, hasJoinedGame')]
]
add(std_table(headers_schema, rows_schema, [3.2*cm, 2.8*cm, 3.2*cm, 6.3*cm]))
add(SP(12))
add(H3('Sample Client Screenshot Placeholder'))
add(P('The interface uses a dark-themed responsive glassmorphic card design displaying the question prompt, answer choice buttons, a countdown wheel, and live rankings.'))
add(SP(6))
ext(ss_placeholder('Game Play Dashboard', 'Question: What is O(1) time complexity?', w=14.5*cm, h=7.5*cm, cap='Figure 4.4: Next.js Client Dashboard Screenshot Placeholder'))
add(PB())

# CHAPTER 5
add(H1('Chapter 5: Implementation & Testing')); add(HR()); add(SP(10))
add(H2('5.1 System Specifications (Hardware & Software)'))
add(P('The platform was compiled and executed under the following technical conditions:'))
add(SP(6))
specs_headers = [P('Resource Type', bold_s), P('Development Specification', bold_s), P('Deployment Target', bold_s)]
specs_rows = [
    [P('Processor (CPU)'), P('Intel Core i5-11400H @ 2.70GHz (6 Cores)'), P('Shared VPS Intel Xeon (2 vCPUs)')],
    [P('Memory (RAM)'), P('16.0 GB DDR4 System RAM'), P('2.0 GB Server RAM')],
    [P('Operating System'), P('Windows 11 Home (x64 Build)'), P('Ubuntu 22.04 LTS (Linux Kernel)')],
    [P('Node.js Environment'), P('Node.js v20.11.0 / npm v10.2.4'), P('Node.js v20 LTS Runtime')],
    [P('Databases'), P('PostgreSQL v16.1 & Redis v7.2 (Docker)'), P('Neon PG Serverless & Upstash Redis')]
]
add(std_table(specs_headers, specs_rows, [4*cm, 6*cm, 5.5*cm]))
add(SP(12))

add(H2('5.2 Implementation Highlights'))
add(P('The core backend game controller coordinates the 15-second round cycles using active timers. The following block highlights the server-side Socket.IO handler:'))
add(SP(4))
code_lines = [
    "// Server-side Socket.IO Game Controller snippet",
    "socket.on('game:submitAnswer', async ({ roomId, userId, optionId }) => {",
    "  const key = `room:${roomId}:answers:${currentQuestionIndex}`;",
    "  const timeKey = `room:${roomId}:meta`;",
    "  ",
    "  // 1. Fetch start time from Redis to validate answer time limit",
    "  const startTime = await redis.hget(timeKey, 'startTime');",
    "  const elapsed = Date.now() - Number(startTime);",
    "  if (elapsed > 15000) return socket.emit('game:error', 'Time window expired');",
    "  ",
    "  // 2. Write answer to Redis cache (O(1) complexity)",
    "  await redis.hset(key, userId, optionId);",
    "  ",
    "  // 3. Increment score if answer is correct",
    "  const isCorrect = await checkAnswer(optionId);",
    "  if (isCorrect) {",
    "    await redis.hincrby(`room:${roomId}:scores`, userId, 100);",
    "  }",
    "});"
]
add(code_block(code_lines))
add(SP(10))

add(H2('5.3 Testing Methodologies'))
add(P('A combination of unit testing (using Jest) and integration load testing was performed to validate stability:'))
add(SP(6))
test_headers = [P('Test Case ID', bold_s), P('Module Tested', bold_s), P('Input / Scenario', bold_s), P('Expected Output', bold_s), P('Result', bold_s)]
test_rows = [
    [P('TC-AUTH-01'), P('Authentication'), P('Register duplicate username'), P('Return 409 Conflict'), P('Passed')],
    [P('TC-LOBB-03'), P('Lobby Manager'), P('Client joins invalid room code'), P('Emit room:notFound socket error'), P('Passed')],
    [P('TC-GAME-02'), P('Game Engine'), P('Submit answer after 16 seconds'), P('Ignore submission, score = +0'), P('Passed')],
    [P('TC-SYNC-01'), P('Reconnection'), P('Refresh page during Q3 at 6s elapsed'), P('UI reloads Q3 showing 9s left'), P('Passed')],
    [P('TC-PERS-04'), P('Persistence'), P('Complete last question of room'), P('Prisma writes stats, Redis keys deleted'), P('Passed')]
]
add(std_table(test_headers, test_rows, [2.5*cm, 2.8*cm, 4*cm, 4.7*cm, 1.5*cm]))
add(PB())

# CHAPTER 6
add(H1('Chapter 6: Conclusion & Future Scope')); add(HR()); add(SP(10))
add(H2('6.1 Summary of Findings'))
add(P('QuizMaster Turbo successfully demonstrates the viability of a hybrid persistence model for real-time web gaming. Using Socket.IO web sockets allows instantaneous event delivery, while Redis bypasses traditional relational database bottlenecks by keeping ephemeral connection states and live scoreboards in memory. The Next.js client renders dynamic screens responsively, and the state-recovery protocol effectively handles unexpected network disconnections, achieving a premium, robust user experience.'))
add(SP(10))

add(H2('6.2 Limitations of the System'))
add(P('Despite meeting its core goals, the prototype contains certain limitations:'))
add(B('<b>Redis Memory Bounds:</b> Since Redis holds active states in RAM, a huge spike in concurrent rooms could lead to server memory exhaustion if expired keys are not actively cleaned up.'))
add(B('<b>Single Server Limitation:</b> Without a Redis Pub/Sub adapter, socket rooms must reside on the same Express instance. Scaling across multiple container instances requires configuring a Socket.IO Redis Adapter.'))
add(B('<b>Static Question Formats:</b> Currently, the platform supports multiple-choice questions only, lacking text inputs, match-the-following, or audio/video attachments.'))
add(SP(10))

add(H2('6.3 Future Enhancements'))
add(P('Planned improvements for future iterations include:'))
add(B('<b>Horizontal Clustering:</b> Deploying Socket.IO Redis Adapters to cluster socket servers across multi-instance Kubernetes pods.'))
add(B('<b>Rich Media Support:</b> Allowing creators to attach image, audio, and YouTube video embeds to questions.'))
add(B('<b>Advanced Anti-Cheat:</b> Tracking tab changes or browser focus loss to flag cheating attempts by participants.'))
add(SP(15))

# BIBLIOGRAPHY
add(H1('Bibliography / References')); add(HR()); add(SP(10))
refs = [
    'R. Fielding, "Architectural Styles and the Design of Network-based Software Architectures," Ph.D. dissertation, University of California, Irvine, 2000.',
    "K. Chodorow, MongoDB: The Definitive Guide, 2nd ed. O'Reilly Media, 2013.",
    'B. Segers, "Real-time web communication using WebSockets," International Journal of Web Engineering, vol. 12, no. 4, pp. 112–119, 2021.',
    'Socket.IO Documentation, "Connection State Recovery," [Online]. Available: https://socket.io/docs/v4/connection-state-recovery/. Accessed June 2026.',
    'Prisma ORM Reference, "Database connections and migrations with PostgreSQL," [Online]. Available: https://www.prisma.io/docs/concepts/database-connection/. Accessed June 2026.',
    'Redis Inc., "Redis Commands and Data Structures Reference," [Online]. Available: https://redis.io/commands/. Accessed June 2026.',
    'M. Haverbeke, Eloquent JavaScript: A Modern Introduction to Programming, 3rd ed. No Starch Press, 2018.',
]
for i, ref in enumerate(refs):
    add(P(f'[{i+1}] {ref}')); add(SP(6))

# ═══════════════════════════════════════════════════════════════════════════
#  DOCUMENT COMPILATION
# ═══════════════════════════════════════════════════════════════════════════
import sys

def build_pdf(filename="quiz_master_report.pdf"):
    print(f"Building PDF: {filename} ...")
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=2*cm,
        rightMargin=2*cm,
        topMargin=2.5*cm,
        bottomMargin=2.5*cm
    )
    # Build document
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print("PDF generation complete!")

if __name__ == '__main__':
    # Default filename or path provided as arg
    out = sys.argv[1] if len(sys.argv) > 1 else "quiz_master_report.pdf"
    build_pdf(out)
