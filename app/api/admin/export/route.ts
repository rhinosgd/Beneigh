import { desc } from "drizzle-orm";
import { getDb } from "../../../../db";
import { bookings } from "../../../../db/schema";
import { isAdmin } from "../../../../lib/admin-auth";
const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
export async function GET(request: Request) {
  if (!(await isAdmin(request)))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await getDb()
    .select()
    .from(bookings)
    .orderBy(desc(bookings.createdAt));
  const headers = [
    "预约编号", "称谓", "客户姓名", "电子邮箱", "国家", "地区/城市", "预计抵达", "预计返程", "服务项目", "备注", "语言", "状态", "提交时间",
  ];
  const widths = [95, 48, 100, 145, 90, 100, 82, 82, 160, 180, 58, 72, 115];
  const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#DCEBEA" ss:Pattern="Solid"/><Alignment ss:WrapText="1"/></Style><Style ss:ID="Body"><Alignment ss:Vertical="Top" ss:WrapText="1"/></Style></Styles><Worksheet ss:Name="预约订单"><Table>${widths.map((w) => `<Column ss:Width="${w}"/>`).join("")}<Row ss:StyleID="Header">${headers.map((x) => `<Cell><Data ss:Type="String">${x}</Data></Cell>`).join("")}</Row>${rows.map((r) => `<Row ss:StyleID="Body">${[r.reference, r.title, r.name, r.email, r.country, r.region, r.arrivalDate || r.preferredDate, r.returnDate, r.services, r.notes, r.language, r.status, r.createdAt].map((x) => `<Cell><Data ss:Type="String">${esc(x)}</Data></Cell>`).join("")}</Row>`).join("")}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><PageSetup><Layout x:Orientation="Landscape"/><Header x:Margin="0.2"/><Footer x:Margin="0.2"/><PageMargins x:Bottom="0.35" x:Left="0.25" x:Right="0.25" x:Top="0.35"/></PageSetup><FitToPage/><Print><FitWidth>1</FitWidth><FitHeight>0</FitHeight><PaperSizeIndex>9</PaperSizeIndex><ValidPrinterInfo/></Print><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane><ActivePane>2</ActivePane></WorksheetOptions></Worksheet></Workbook>`;
  return new Response(xml, {
    headers: {
      "content-type": "application/vnd.ms-excel; charset=utf-8",
      "content-disposition": "attachment; filename=beneigh-bookings-a4.xls",
    },
  });
}
