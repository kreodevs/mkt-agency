import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductService } from '../product/product.service';
import {
  CreateFormDto,
  SubmitFormDto,
  UpdateFormDto,
} from './dto/form.request.dto';
import {
  FormResponseDto,
  FormSnippetResponseDto,
  FormSubmissionResponseDto,
  PaginatedFormSubmissionsResponseDto,
  PaginatedFormsResponseDto,
  SubmitFormResponseDto,
} from './dto/form.response.dto';
import { FormEntity } from './infrastructure/typeorm/form.entity';
import { FormSubmissionEntity } from './infrastructure/typeorm/form-submission.entity';
import { SubmitFormCommand } from '../crm/commands/submit-form.command';
import { SubmitFormHandler } from '../crm/commands/submit-form.handler';

@Injectable()
export class FormService {
  constructor(
    @InjectRepository(FormEntity)
    private readonly forms: Repository<FormEntity>,
    @InjectRepository(FormSubmissionEntity)
    private readonly submissions: Repository<FormSubmissionEntity>,
    private readonly submitFormHandler: SubmitFormHandler,
    private readonly config: ConfigService,
    private readonly productService: ProductService,
  ) {}

  async list(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedFormsResponseDto> {
    const [items, total] = await this.forms.findAndCount({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
    };
  }

  async create(tenantId: string, dto: CreateFormDto): Promise<FormResponseDto> {
    const productId = await this.resolveProductId(tenantId, dto.productId);
    const snippetJs = this.buildSnippetJs('PLACEHOLDER', dto.fields, productId);
    const saved = await this.forms.save(
      this.forms.create({
        tenantId,
        productId,
        name: dto.name,
        fields: dto.fields,
        style: dto.style ?? {},
        isActive: dto.isActive ?? true,
        snippetJs,
      }),
    );

    saved.snippetJs = this.buildSnippetJs(saved.id, saved.fields, saved.productId);
    await this.forms.save(saved);

    return this.toResponse(saved);
  }

  async findOne(tenantId: string, id: string): Promise<FormResponseDto> {
    const form = await this.findOwnedForm(tenantId, id);
    return this.toResponse(form);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateFormDto,
  ): Promise<FormResponseDto> {
    const form = await this.findOwnedForm(tenantId, id);

    if (dto.name !== undefined) form.name = dto.name;
    if (dto.fields !== undefined) form.fields = dto.fields;
    if (dto.style !== undefined) form.style = dto.style;
    if (dto.isActive !== undefined) form.isActive = dto.isActive;
    if (dto.productId !== undefined) {
      form.productId = await this.resolveProductId(tenantId, dto.productId);
    }

    form.snippetJs = this.buildSnippetJs(form.id, form.fields, form.productId);
    const saved = await this.forms.save(form);
    return this.toResponse(saved);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const form = await this.findOwnedForm(tenantId, id);
    await this.forms.remove(form);
  }

  async getSnippet(tenantId: string, id: string): Promise<FormSnippetResponseDto> {
    const form = await this.findOwnedForm(tenantId, id);
    const snippetJs = form.snippetJs ?? this.buildSnippetJs(form.id, form.fields, form.productId);

    return {
      formId: form.id,
      snippetJs,
      snippetHtml: this.buildSnippetHtml(form.id, form.fields, form.style),
    };
  }

  async submit(formId: string, dto: SubmitFormDto): Promise<SubmitFormResponseDto> {
    return this.submitFormHandler.execute(
      new SubmitFormCommand(formId, dto as unknown as Record<string, unknown>),
    );
  }

  async listSubmissions(
    tenantId: string,
    formId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedFormSubmissionsResponseDto> {
    await this.findOwnedForm(tenantId, formId);

    const [items, total] = await this.submissions.findAndCount({
      where: { formId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((item) => this.toSubmissionResponse(item)),
      total,
      page,
      limit,
    };
  }

  private async findOwnedForm(tenantId: string, id: string): Promise<FormEntity> {
    const form = await this.forms.findOne({ where: { id, tenantId } });
    if (!form) {
      throw new NotFoundException({
        error: 'Form not found',
        code: 'NOT_FOUND',
      });
    }
    return form;
  }

  private toResponse(form: FormEntity): FormResponseDto {
    return {
      id: form.id,
      tenantId: form.tenantId,
      productId: form.productId,
      name: form.name,
      fields: form.fields,
      style: form.style,
      snippetJs: form.snippetJs,
      isActive: form.isActive,
      createdAt: form.createdAt.toISOString(),
      updatedAt: form.updatedAt.toISOString(),
    };
  }

  private toSubmissionResponse(item: FormSubmissionEntity): FormSubmissionResponseDto {
    return {
      id: item.id,
      formId: item.formId,
      leadId: item.leadId,
      data: item.data,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private apiBaseUrl(): string {
    return this.config.get<string>('API_PUBLIC_URL', 'http://localhost:3000/api/v1');
  }

  private buildSnippetJs(
    formId: string,
    fields: FormEntity['fields'],
    productId?: string | null,
  ): string {
    const apiBase = this.apiBaseUrl();
    const fieldConfig = JSON.stringify(fields);
    const productIdLiteral = productId ? `"${productId}"` : 'null';

    return `(function(){
  var FORM_ID = "${formId}";
  var API = "${apiBase}/forms/" + FORM_ID + "/submit";
  var FIELDS = ${fieldConfig};
  var PRODUCT_ID = ${productIdLiteral};

  function renderForm(container) {
    if (!container) return;
    container.innerHTML = "";
    var form = document.createElement("form");
    form.style.display = "flex";
    form.style.flexDirection = "column";
    form.style.gap = "8px";

    FIELDS.forEach(function(field) {
      var label = document.createElement("label");
      label.textContent = field.label;
      var input = field.type === "textarea"
        ? document.createElement("textarea")
        : document.createElement("input");
      if (field.type !== "textarea") input.type = field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text";
      input.name = field.name;
      input.required = !!field.required;
      label.appendChild(input);
      form.appendChild(label);
    });

    var button = document.createElement("button");
    button.type = "submit";
    button.textContent = "Enviar";
    form.appendChild(button);

    form.addEventListener("submit", function(ev) {
      ev.preventDefault();
      var data = {};
      FIELDS.forEach(function(field) {
        var el = form.querySelector("[name='" + field.name + "']");
        data[field.name] = el ? el.value : "";
      });
      if (PRODUCT_ID) data.productId = PRODUCT_ID;
      fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(function(res) {
        if (!res.ok) throw new Error("Submit failed");
        button.textContent = "Enviado";
        form.reset();
      }).catch(function() {
        button.textContent = "Error — reintentar";
      });
    });

    container.appendChild(form);
  }

  window.MktAgencyEmbed = window.MktAgencyEmbed || {};
  window.MktAgencyEmbed[FORM_ID] = renderForm;
})();`;
  }

  private buildSnippetHtml(
    formId: string,
    fields: FormEntity['fields'],
    style: Record<string, unknown>,
  ): string {
    const primary = typeof style.primaryColor === 'string' ? style.primaryColor : '#2563eb';
    const inputs = fields
      .map(
        (field) =>
          `<label style="display:block;margin-bottom:8px">${field.label}<br/>${
            field.type === 'textarea'
              ? `<textarea name="${field.name}" ${field.required ? 'required' : ''} style="width:100%"></textarea>`
              : `<input type="${field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}" name="${field.name}" ${field.required ? 'required' : ''} style="width:100%" />`
          }</label>`,
      )
      .join('');

    return `<div id="mkt-form-${formId}" style="font-family:sans-serif;max-width:420px">${inputs}<button type="button" style="background:${primary};color:#fff;border:0;padding:8px 16px;border-radius:6px">Usar snippet JS para envío</button></div>`;
  }

  private async resolveProductId(
    tenantId: string,
    productId?: string | null,
  ): Promise<string | null> {
    if (productId === undefined || productId === null) {
      return null;
    }

    await this.productService.findOwnedEntity(tenantId, productId);
    return productId;
  }
}
