// node_modules/@lit/reactive-element/css-tag.js
var t = globalThis;
var e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var s = Symbol();
var o = /* @__PURE__ */ new WeakMap();
var n = class {
  constructor(t3, e4, o5) {
    if (this._$cssResult$ = true, o5 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t3, this.t = e4;
  }
  get styleSheet() {
    let t3 = this.o;
    const s4 = this.t;
    if (e && void 0 === t3) {
      const e4 = void 0 !== s4 && 1 === s4.length;
      e4 && (t3 = o.get(s4)), void 0 === t3 && ((this.o = t3 = new CSSStyleSheet()).replaceSync(this.cssText), e4 && o.set(s4, t3));
    }
    return t3;
  }
  toString() {
    return this.cssText;
  }
};
var r = (t3) => new n("string" == typeof t3 ? t3 : t3 + "", void 0, s);
var i = (t3, ...e4) => {
  const o5 = 1 === t3.length ? t3[0] : e4.reduce((e5, s4, o6) => e5 + ((t4) => {
    if (true === t4._$cssResult$) return t4.cssText;
    if ("number" == typeof t4) return t4;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t4 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s4) + t3[o6 + 1], t3[0]);
  return new n(o5, t3, s);
};
var S = (s4, o5) => {
  if (e) s4.adoptedStyleSheets = o5.map((t3) => t3 instanceof CSSStyleSheet ? t3 : t3.styleSheet);
  else for (const e4 of o5) {
    const o6 = document.createElement("style"), n4 = t.litNonce;
    void 0 !== n4 && o6.setAttribute("nonce", n4), o6.textContent = e4.cssText, s4.appendChild(o6);
  }
};
var c = e ? (t3) => t3 : (t3) => t3 instanceof CSSStyleSheet ? ((t4) => {
  let e4 = "";
  for (const s4 of t4.cssRules) e4 += s4.cssText;
  return r(e4);
})(t3) : t3;

// node_modules/@lit/reactive-element/reactive-element.js
var { is: i2, defineProperty: e2, getOwnPropertyDescriptor: h, getOwnPropertyNames: r2, getOwnPropertySymbols: o2, getPrototypeOf: n2 } = Object;
var a = globalThis;
var c2 = a.trustedTypes;
var l = c2 ? c2.emptyScript : "";
var p = a.reactiveElementPolyfillSupport;
var d = (t3, s4) => t3;
var u = { toAttribute(t3, s4) {
  switch (s4) {
    case Boolean:
      t3 = t3 ? l : null;
      break;
    case Object:
    case Array:
      t3 = null == t3 ? t3 : JSON.stringify(t3);
  }
  return t3;
}, fromAttribute(t3, s4) {
  let i5 = t3;
  switch (s4) {
    case Boolean:
      i5 = null !== t3;
      break;
    case Number:
      i5 = null === t3 ? null : Number(t3);
      break;
    case Object:
    case Array:
      try {
        i5 = JSON.parse(t3);
      } catch (t4) {
        i5 = null;
      }
  }
  return i5;
} };
var f = (t3, s4) => !i2(t3, s4);
var b = { attribute: true, type: String, converter: u, reflect: false, useDefault: false, hasChanged: f };
Symbol.metadata ??= Symbol("metadata"), a.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var y = class extends HTMLElement {
  static addInitializer(t3) {
    this._$Ei(), (this.l ??= []).push(t3);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t3, s4 = b) {
    if (s4.state && (s4.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t3) && ((s4 = Object.create(s4)).wrapped = true), this.elementProperties.set(t3, s4), !s4.noAccessor) {
      const i5 = Symbol(), h3 = this.getPropertyDescriptor(t3, i5, s4);
      void 0 !== h3 && e2(this.prototype, t3, h3);
    }
  }
  static getPropertyDescriptor(t3, s4, i5) {
    const { get: e4, set: r4 } = h(this.prototype, t3) ?? { get() {
      return this[s4];
    }, set(t4) {
      this[s4] = t4;
    } };
    return { get: e4, set(s5) {
      const h3 = e4?.call(this);
      r4?.call(this, s5), this.requestUpdate(t3, h3, i5);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t3) {
    return this.elementProperties.get(t3) ?? b;
  }
  static _$Ei() {
    if (this.hasOwnProperty(d("elementProperties"))) return;
    const t3 = n2(this);
    t3.finalize(), void 0 !== t3.l && (this.l = [...t3.l]), this.elementProperties = new Map(t3.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(d("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d("properties"))) {
      const t4 = this.properties, s4 = [...r2(t4), ...o2(t4)];
      for (const i5 of s4) this.createProperty(i5, t4[i5]);
    }
    const t3 = this[Symbol.metadata];
    if (null !== t3) {
      const s4 = litPropertyMetadata.get(t3);
      if (void 0 !== s4) for (const [t4, i5] of s4) this.elementProperties.set(t4, i5);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t4, s4] of this.elementProperties) {
      const i5 = this._$Eu(t4, s4);
      void 0 !== i5 && this._$Eh.set(i5, t4);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(s4) {
    const i5 = [];
    if (Array.isArray(s4)) {
      const e4 = new Set(s4.flat(1 / 0).reverse());
      for (const s5 of e4) i5.unshift(c(s5));
    } else void 0 !== s4 && i5.push(c(s4));
    return i5;
  }
  static _$Eu(t3, s4) {
    const i5 = s4.attribute;
    return false === i5 ? void 0 : "string" == typeof i5 ? i5 : "string" == typeof t3 ? t3.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t3) => this.enableUpdating = t3), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t3) => t3(this));
  }
  addController(t3) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t3), void 0 !== this.renderRoot && this.isConnected && t3.hostConnected?.();
  }
  removeController(t3) {
    this._$EO?.delete(t3);
  }
  _$E_() {
    const t3 = /* @__PURE__ */ new Map(), s4 = this.constructor.elementProperties;
    for (const i5 of s4.keys()) this.hasOwnProperty(i5) && (t3.set(i5, this[i5]), delete this[i5]);
    t3.size > 0 && (this._$Ep = t3);
  }
  createRenderRoot() {
    const t3 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return S(t3, this.constructor.elementStyles), t3;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach((t3) => t3.hostConnected?.());
  }
  enableUpdating(t3) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t3) => t3.hostDisconnected?.());
  }
  attributeChangedCallback(t3, s4, i5) {
    this._$AK(t3, i5);
  }
  _$ET(t3, s4) {
    const i5 = this.constructor.elementProperties.get(t3), e4 = this.constructor._$Eu(t3, i5);
    if (void 0 !== e4 && true === i5.reflect) {
      const h3 = (void 0 !== i5.converter?.toAttribute ? i5.converter : u).toAttribute(s4, i5.type);
      this._$Em = t3, null == h3 ? this.removeAttribute(e4) : this.setAttribute(e4, h3), this._$Em = null;
    }
  }
  _$AK(t3, s4) {
    const i5 = this.constructor, e4 = i5._$Eh.get(t3);
    if (void 0 !== e4 && this._$Em !== e4) {
      const t4 = i5.getPropertyOptions(e4), h3 = "function" == typeof t4.converter ? { fromAttribute: t4.converter } : void 0 !== t4.converter?.fromAttribute ? t4.converter : u;
      this._$Em = e4;
      const r4 = h3.fromAttribute(s4, t4.type);
      this[e4] = r4 ?? this._$Ej?.get(e4) ?? r4, this._$Em = null;
    }
  }
  requestUpdate(t3, s4, i5, e4 = false, h3) {
    if (void 0 !== t3) {
      const r4 = this.constructor;
      if (false === e4 && (h3 = this[t3]), i5 ??= r4.getPropertyOptions(t3), !((i5.hasChanged ?? f)(h3, s4) || i5.useDefault && i5.reflect && h3 === this._$Ej?.get(t3) && !this.hasAttribute(r4._$Eu(t3, i5)))) return;
      this.C(t3, s4, i5);
    }
    false === this.isUpdatePending && (this._$ES = this._$EP());
  }
  C(t3, s4, { useDefault: i5, reflect: e4, wrapped: h3 }, r4) {
    i5 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t3) && (this._$Ej.set(t3, r4 ?? s4 ?? this[t3]), true !== h3 || void 0 !== r4) || (this._$AL.has(t3) || (this.hasUpdated || i5 || (s4 = void 0), this._$AL.set(t3, s4)), true === e4 && this._$Em !== t3 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t3));
  }
  async _$EP() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t4) {
      Promise.reject(t4);
    }
    const t3 = this.scheduleUpdate();
    return null != t3 && await t3, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [t5, s5] of this._$Ep) this[t5] = s5;
        this._$Ep = void 0;
      }
      const t4 = this.constructor.elementProperties;
      if (t4.size > 0) for (const [s5, i5] of t4) {
        const { wrapped: t5 } = i5, e4 = this[s5];
        true !== t5 || this._$AL.has(s5) || void 0 === e4 || this.C(s5, void 0, i5, e4);
      }
    }
    let t3 = false;
    const s4 = this._$AL;
    try {
      t3 = this.shouldUpdate(s4), t3 ? (this.willUpdate(s4), this._$EO?.forEach((t4) => t4.hostUpdate?.()), this.update(s4)) : this._$EM();
    } catch (s5) {
      throw t3 = false, this._$EM(), s5;
    }
    t3 && this._$AE(s4);
  }
  willUpdate(t3) {
  }
  _$AE(t3) {
    this._$EO?.forEach((t4) => t4.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t3)), this.updated(t3);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t3) {
    return true;
  }
  update(t3) {
    this._$Eq &&= this._$Eq.forEach((t4) => this._$ET(t4, this[t4])), this._$EM();
  }
  updated(t3) {
  }
  firstUpdated(t3) {
  }
};
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[d("elementProperties")] = /* @__PURE__ */ new Map(), y[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: y }), (a.reactiveElementVersions ??= []).push("2.1.2");

// node_modules/lit-html/lit-html.js
var t2 = globalThis;
var i3 = (t3) => t3;
var s2 = t2.trustedTypes;
var e3 = s2 ? s2.createPolicy("lit-html", { createHTML: (t3) => t3 }) : void 0;
var h2 = "$lit$";
var o3 = `lit$${Math.random().toFixed(9).slice(2)}$`;
var n3 = "?" + o3;
var r3 = `<${n3}>`;
var l2 = document;
var c3 = () => l2.createComment("");
var a2 = (t3) => null === t3 || "object" != typeof t3 && "function" != typeof t3;
var u2 = Array.isArray;
var d2 = (t3) => u2(t3) || "function" == typeof t3?.[Symbol.iterator];
var f2 = "[ 	\n\f\r]";
var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var _ = /-->/g;
var m = />/g;
var p2 = RegExp(`>|${f2}(?:([^\\s"'>=/]+)(${f2}*=${f2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
var g = /'/g;
var $ = /"/g;
var y2 = /^(?:script|style|textarea|title)$/i;
var x = (t3) => (i5, ...s4) => ({ _$litType$: t3, strings: i5, values: s4 });
var b2 = x(1);
var w = x(2);
var T = x(3);
var E = Symbol.for("lit-noChange");
var A = Symbol.for("lit-nothing");
var C = /* @__PURE__ */ new WeakMap();
var P = l2.createTreeWalker(l2, 129);
function V(t3, i5) {
  if (!u2(t3) || !t3.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e3 ? e3.createHTML(i5) : i5;
}
var N = (t3, i5) => {
  const s4 = t3.length - 1, e4 = [];
  let n4, l3 = 2 === i5 ? "<svg>" : 3 === i5 ? "<math>" : "", c4 = v;
  for (let i6 = 0; i6 < s4; i6++) {
    const s5 = t3[i6];
    let a3, u3, d3 = -1, f3 = 0;
    for (; f3 < s5.length && (c4.lastIndex = f3, u3 = c4.exec(s5), null !== u3); ) f3 = c4.lastIndex, c4 === v ? "!--" === u3[1] ? c4 = _ : void 0 !== u3[1] ? c4 = m : void 0 !== u3[2] ? (y2.test(u3[2]) && (n4 = RegExp("</" + u3[2], "g")), c4 = p2) : void 0 !== u3[3] && (c4 = p2) : c4 === p2 ? ">" === u3[0] ? (c4 = n4 ?? v, d3 = -1) : void 0 === u3[1] ? d3 = -2 : (d3 = c4.lastIndex - u3[2].length, a3 = u3[1], c4 = void 0 === u3[3] ? p2 : '"' === u3[3] ? $ : g) : c4 === $ || c4 === g ? c4 = p2 : c4 === _ || c4 === m ? c4 = v : (c4 = p2, n4 = void 0);
    const x2 = c4 === p2 && t3[i6 + 1].startsWith("/>") ? " " : "";
    l3 += c4 === v ? s5 + r3 : d3 >= 0 ? (e4.push(a3), s5.slice(0, d3) + h2 + s5.slice(d3) + o3 + x2) : s5 + o3 + (-2 === d3 ? i6 : x2);
  }
  return [V(t3, l3 + (t3[s4] || "<?>") + (2 === i5 ? "</svg>" : 3 === i5 ? "</math>" : "")), e4];
};
var S2 = class _S {
  constructor({ strings: t3, _$litType$: i5 }, e4) {
    let r4;
    this.parts = [];
    let l3 = 0, a3 = 0;
    const u3 = t3.length - 1, d3 = this.parts, [f3, v2] = N(t3, i5);
    if (this.el = _S.createElement(f3, e4), P.currentNode = this.el.content, 2 === i5 || 3 === i5) {
      const t4 = this.el.content.firstChild;
      t4.replaceWith(...t4.childNodes);
    }
    for (; null !== (r4 = P.nextNode()) && d3.length < u3; ) {
      if (1 === r4.nodeType) {
        if (r4.hasAttributes()) for (const t4 of r4.getAttributeNames()) if (t4.endsWith(h2)) {
          const i6 = v2[a3++], s4 = r4.getAttribute(t4).split(o3), e5 = /([.?@])?(.*)/.exec(i6);
          d3.push({ type: 1, index: l3, name: e5[2], strings: s4, ctor: "." === e5[1] ? I : "?" === e5[1] ? L : "@" === e5[1] ? z : H }), r4.removeAttribute(t4);
        } else t4.startsWith(o3) && (d3.push({ type: 6, index: l3 }), r4.removeAttribute(t4));
        if (y2.test(r4.tagName)) {
          const t4 = r4.textContent.split(o3), i6 = t4.length - 1;
          if (i6 > 0) {
            r4.textContent = s2 ? s2.emptyScript : "";
            for (let s4 = 0; s4 < i6; s4++) r4.append(t4[s4], c3()), P.nextNode(), d3.push({ type: 2, index: ++l3 });
            r4.append(t4[i6], c3());
          }
        }
      } else if (8 === r4.nodeType) if (r4.data === n3) d3.push({ type: 2, index: l3 });
      else {
        let t4 = -1;
        for (; -1 !== (t4 = r4.data.indexOf(o3, t4 + 1)); ) d3.push({ type: 7, index: l3 }), t4 += o3.length - 1;
      }
      l3++;
    }
  }
  static createElement(t3, i5) {
    const s4 = l2.createElement("template");
    return s4.innerHTML = t3, s4;
  }
};
function M(t3, i5, s4 = t3, e4) {
  if (i5 === E) return i5;
  let h3 = void 0 !== e4 ? s4._$Co?.[e4] : s4._$Cl;
  const o5 = a2(i5) ? void 0 : i5._$litDirective$;
  return h3?.constructor !== o5 && (h3?._$AO?.(false), void 0 === o5 ? h3 = void 0 : (h3 = new o5(t3), h3._$AT(t3, s4, e4)), void 0 !== e4 ? (s4._$Co ??= [])[e4] = h3 : s4._$Cl = h3), void 0 !== h3 && (i5 = M(t3, h3._$AS(t3, i5.values), h3, e4)), i5;
}
var R = class {
  constructor(t3, i5) {
    this._$AV = [], this._$AN = void 0, this._$AD = t3, this._$AM = i5;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t3) {
    const { el: { content: i5 }, parts: s4 } = this._$AD, e4 = (t3?.creationScope ?? l2).importNode(i5, true);
    P.currentNode = e4;
    let h3 = P.nextNode(), o5 = 0, n4 = 0, r4 = s4[0];
    for (; void 0 !== r4; ) {
      if (o5 === r4.index) {
        let i6;
        2 === r4.type ? i6 = new k(h3, h3.nextSibling, this, t3) : 1 === r4.type ? i6 = new r4.ctor(h3, r4.name, r4.strings, this, t3) : 6 === r4.type && (i6 = new Z(h3, this, t3)), this._$AV.push(i6), r4 = s4[++n4];
      }
      o5 !== r4?.index && (h3 = P.nextNode(), o5++);
    }
    return P.currentNode = l2, e4;
  }
  p(t3) {
    let i5 = 0;
    for (const s4 of this._$AV) void 0 !== s4 && (void 0 !== s4.strings ? (s4._$AI(t3, s4, i5), i5 += s4.strings.length - 2) : s4._$AI(t3[i5])), i5++;
  }
};
var k = class _k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t3, i5, s4, e4) {
    this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t3, this._$AB = i5, this._$AM = s4, this.options = e4, this._$Cv = e4?.isConnected ?? true;
  }
  get parentNode() {
    let t3 = this._$AA.parentNode;
    const i5 = this._$AM;
    return void 0 !== i5 && 11 === t3?.nodeType && (t3 = i5.parentNode), t3;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t3, i5 = this) {
    t3 = M(this, t3, i5), a2(t3) ? t3 === A || null == t3 || "" === t3 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t3 !== this._$AH && t3 !== E && this._(t3) : void 0 !== t3._$litType$ ? this.$(t3) : void 0 !== t3.nodeType ? this.T(t3) : d2(t3) ? this.k(t3) : this._(t3);
  }
  O(t3) {
    return this._$AA.parentNode.insertBefore(t3, this._$AB);
  }
  T(t3) {
    this._$AH !== t3 && (this._$AR(), this._$AH = this.O(t3));
  }
  _(t3) {
    this._$AH !== A && a2(this._$AH) ? this._$AA.nextSibling.data = t3 : this.T(l2.createTextNode(t3)), this._$AH = t3;
  }
  $(t3) {
    const { values: i5, _$litType$: s4 } = t3, e4 = "number" == typeof s4 ? this._$AC(t3) : (void 0 === s4.el && (s4.el = S2.createElement(V(s4.h, s4.h[0]), this.options)), s4);
    if (this._$AH?._$AD === e4) this._$AH.p(i5);
    else {
      const t4 = new R(e4, this), s5 = t4.u(this.options);
      t4.p(i5), this.T(s5), this._$AH = t4;
    }
  }
  _$AC(t3) {
    let i5 = C.get(t3.strings);
    return void 0 === i5 && C.set(t3.strings, i5 = new S2(t3)), i5;
  }
  k(t3) {
    u2(this._$AH) || (this._$AH = [], this._$AR());
    const i5 = this._$AH;
    let s4, e4 = 0;
    for (const h3 of t3) e4 === i5.length ? i5.push(s4 = new _k(this.O(c3()), this.O(c3()), this, this.options)) : s4 = i5[e4], s4._$AI(h3), e4++;
    e4 < i5.length && (this._$AR(s4 && s4._$AB.nextSibling, e4), i5.length = e4);
  }
  _$AR(t3 = this._$AA.nextSibling, s4) {
    for (this._$AP?.(false, true, s4); t3 !== this._$AB; ) {
      const s5 = i3(t3).nextSibling;
      i3(t3).remove(), t3 = s5;
    }
  }
  setConnected(t3) {
    void 0 === this._$AM && (this._$Cv = t3, this._$AP?.(t3));
  }
};
var H = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t3, i5, s4, e4, h3) {
    this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t3, this.name = i5, this._$AM = e4, this.options = h3, s4.length > 2 || "" !== s4[0] || "" !== s4[1] ? (this._$AH = Array(s4.length - 1).fill(new String()), this.strings = s4) : this._$AH = A;
  }
  _$AI(t3, i5 = this, s4, e4) {
    const h3 = this.strings;
    let o5 = false;
    if (void 0 === h3) t3 = M(this, t3, i5, 0), o5 = !a2(t3) || t3 !== this._$AH && t3 !== E, o5 && (this._$AH = t3);
    else {
      const e5 = t3;
      let n4, r4;
      for (t3 = h3[0], n4 = 0; n4 < h3.length - 1; n4++) r4 = M(this, e5[s4 + n4], i5, n4), r4 === E && (r4 = this._$AH[n4]), o5 ||= !a2(r4) || r4 !== this._$AH[n4], r4 === A ? t3 = A : t3 !== A && (t3 += (r4 ?? "") + h3[n4 + 1]), this._$AH[n4] = r4;
    }
    o5 && !e4 && this.j(t3);
  }
  j(t3) {
    t3 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t3 ?? "");
  }
};
var I = class extends H {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t3) {
    this.element[this.name] = t3 === A ? void 0 : t3;
  }
};
var L = class extends H {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t3) {
    this.element.toggleAttribute(this.name, !!t3 && t3 !== A);
  }
};
var z = class extends H {
  constructor(t3, i5, s4, e4, h3) {
    super(t3, i5, s4, e4, h3), this.type = 5;
  }
  _$AI(t3, i5 = this) {
    if ((t3 = M(this, t3, i5, 0) ?? A) === E) return;
    const s4 = this._$AH, e4 = t3 === A && s4 !== A || t3.capture !== s4.capture || t3.once !== s4.once || t3.passive !== s4.passive, h3 = t3 !== A && (s4 === A || e4);
    e4 && this.element.removeEventListener(this.name, this, s4), h3 && this.element.addEventListener(this.name, this, t3), this._$AH = t3;
  }
  handleEvent(t3) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t3) : this._$AH.handleEvent(t3);
  }
};
var Z = class {
  constructor(t3, i5, s4) {
    this.element = t3, this.type = 6, this._$AN = void 0, this._$AM = i5, this.options = s4;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t3) {
    M(this, t3);
  }
};
var B = t2.litHtmlPolyfillSupport;
B?.(S2, k), (t2.litHtmlVersions ??= []).push("3.3.3");
var D = (t3, i5, s4) => {
  const e4 = s4?.renderBefore ?? i5;
  let h3 = e4._$litPart$;
  if (void 0 === h3) {
    const t4 = s4?.renderBefore ?? null;
    e4._$litPart$ = h3 = new k(i5.insertBefore(c3(), t4), t4, void 0, s4 ?? {});
  }
  return h3._$AI(t3), h3;
};

// node_modules/lit-element/lit-element.js
var s3 = globalThis;
var i4 = class extends y {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t3 = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t3.firstChild, t3;
  }
  update(t3) {
    const r4 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t3), this._$Do = D(r4, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(false);
  }
  render() {
    return E;
  }
};
i4._$litElement$ = true, i4["finalized"] = true, s3.litElementHydrateSupport?.({ LitElement: i4 });
var o4 = s3.litElementPolyfillSupport;
o4?.({ LitElement: i4 });
(s3.litElementVersions ??= []).push("4.2.2");

// src/lg-webos-magic-remote-card.ts
var DEFAULT_SOURCES = [
  { name: "Netflix", label: "NETFLIX", type: "app" },
  { name: "Prime Video", label: "prime video", type: "app" },
  { name: "YouTube", label: "YouTube", type: "app" },
  { name: "LG Channels", label: "LG Channels", type: "app" },
  { name: "HDMI 1", label: "HDMI 1", type: "source" },
  { name: "HDMI 2", label: "HDMI 2", type: "source" }
];
var LgWebosMagicRemoteCard = class extends i4 {
  constructor() {
    super(...arguments);
    this._health = "checking";
    this._error = "";
    this._pendingMove = { dx: 0, dy: 0 };
  }
  setConfig(config) {
    this._config = {
      title: "LG Magic Remote",
      mode: "keypad",
      scale: 1,
      sensitivity: 1.3,
      show_sources: true,
      show_color_buttons: true,
      show_media_buttons: false,
      ...config
    };
    this._checkHealth();
  }
  connectedCallback() {
    super.connectedCallback();
    this._pollTimer = window.setInterval(() => this._checkHealth(), 5e3);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._pollTimer) window.clearInterval(this._pollTimer);
    if (this._raf) cancelAnimationFrame(this._raf);
  }
  render() {
    if (!this._config) return A;
    const scale = String(Number(this._config.scale ?? 1));
    return b2`
      <ha-card>
        <div class="header">
          <div>
            <div class="title">${this._config.title}</div>
            ${this._config.entity ? b2`<div class="entity">${this._config.entity}</div>` : A}
          </div>
          <div class="status ${this._health}">
            <span class="dot"></span>
            <span>${this._health}</span>
          </div>
        </div>

        <div class="remote-wrap">
          <div class="remote" style=${`--remote-scale:${scale}`}>
            <div class="top">
              <span></span>
              <button class="round power" title="Power off" @click=${() => this._command("power_off")}>
                <ha-icon icon="mdi:power"></ha-icon>
              </button>
              <ha-icon class="mic" icon="mdi:microphone"></ha-icon>
            </div>

            ${this._config.mode === "touchpad" ? this._renderTouchPanel() : this._renderKeypad()}

            <div class="guide-row">
              <button class="small" title="Guide" @click=${() => this._command("info")}>GUIDE</button>
              <button class="small" title="Menu" @click=${() => this._command("menu")}>
                <ha-icon icon="mdi:keyboard"></ha-icon>
              </button>
              <button class="small" title="More" @click=${() => this._command("dash")}>•••</button>
            </div>

            <div class="two-side">
              <button class="pill" title="Volume">
                <span @click=${() => this._command("volume_up")}>+</span>
                <span class="sep"></span>
                <span @click=${() => this._command("volume_down")}>−</span>
              </button>
              <div></div>
              <button class="pill" title="Channel">
                <span @click=${() => this._command("channel_up")}>⌃</span>
                <span class="sep"></span>
                <span @click=${() => this._command("channel_down")}>⌄</span>
              </button>
            </div>

            <div class="center-actions">
              <button class="small" title="Home" @click=${() => this._command("home")}>
                <ha-icon icon="mdi:home-outline"></ha-icon>
              </button>
              <button class="small" title="Mute" @click=${() => this._command("mute")}>
                <ha-icon icon="mdi:volume-off"></ha-icon>
              </button>
              <button class="small" title="Input" @click=${() => this._command("source", { source: "HDMI 1" })}>
                <ha-icon icon="mdi:import"></ha-icon>
              </button>
            </div>

            ${this._renderWheel()}

            <div class="post-wheel">
              <button class="small" title="Back" @click=${() => this._command("back")}>
                <ha-icon icon="mdi:arrow-u-left-top"></ha-icon>
              </button>
              <button class="small" title="Settings" @click=${() => this._command("menu")}>
                <ha-icon icon="mdi:cog-outline"></ha-icon>
              </button>
            </div>

            ${this._config.show_color_buttons ? this._renderColorButtons() : A}
            ${this._config.show_media_buttons ? this._renderMediaButtons() : A}
            ${this._config.show_sources ? this._renderSources() : A}
          </div>
        </div>

        ${this._error ? b2`<div class="error">${this._error}</div>` : A}
      </ha-card>
    `;
  }
  _renderKeypad() {
    return b2`
      <div class="keypad grid three">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
      (num) => b2`<button class="round" @click=${() => this._command(`num_${num}`)}>${num}</button>`
    )}
        <button class="round" @click=${() => this._command("info")}>GUIDE</button>
        <button class="round" @click=${() => this._command("num_0")}>0</button>
        <button class="round" @click=${() => this._command("dash")}>•••</button>
      </div>
    `;
  }
  _renderTouchPanel() {
    return b2`
      <div
        class="touchpanel"
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._onPointerUp}
        @wheel=${this._onWheel}
      >
        <span class="touchdot"></span>
      </div>
    `;
  }
  _renderWheel() {
    return b2`
      <div class="wheel">
        <button class="up" title="Up" @click=${() => this._command("up")}>
          <ha-icon icon="mdi:chevron-up"></ha-icon>
        </button>
        <button class="left" title="Left" @click=${() => this._command("left")}>
          <ha-icon icon="mdi:chevron-left"></ha-icon>
        </button>
        <button class="ok" title="OK" @click=${() => this._command("ok")}>OK</button>
        <button class="right" title="Right" @click=${() => this._command("right")}>
          <ha-icon icon="mdi:chevron-right"></ha-icon>
        </button>
        <button class="down" title="Down" @click=${() => this._command("down")}>
          <ha-icon icon="mdi:chevron-down"></ha-icon>
        </button>
      </div>
    `;
  }
  _renderColorButtons() {
    return b2`
      <div class="color-row">
        <button class="color red" title="Red" @click=${() => this._command("red")}>red</button>
        <button class="color green" title="Green" @click=${() => this._command("green")}>green</button>
        <button class="color yellow" title="Yellow" @click=${() => this._command("yellow")}>yellow</button>
        <button class="color blue" title="Blue" @click=${() => this._command("blue")}>blue</button>
      </div>
    `;
  }
  _renderMediaButtons() {
    return b2`
      <div class="media-row">
        <button title="Rewind" @click=${() => this._command("rewind")}>
          <ha-icon icon="mdi:rewind"></ha-icon>
        </button>
        <button title="Play" @click=${() => this._command("play")}>
          <ha-icon icon="mdi:play"></ha-icon>
        </button>
        <button title="Pause" @click=${() => this._command("pause")}>
          <ha-icon icon="mdi:pause"></ha-icon>
        </button>
        <button title="Stop" @click=${() => this._command("stop")}>
          <ha-icon icon="mdi:stop"></ha-icon>
        </button>
        <button title="Fast forward" @click=${() => this._command("fastforward")}>
          <ha-icon icon="mdi:fast-forward"></ha-icon>
        </button>
      </div>
    `;
  }
  _renderSources() {
    const items = this._config.sources?.length ? this._config.sources : DEFAULT_SOURCES;
    const channels = this._config.channels ?? [];
    return b2`
      <div class="sources">
        ${[...items, ...channels].slice(0, 8).map(
      (source) => b2`
            <button
              class="source ${source.name.toLowerCase() === "netflix" ? "netflix" : ""}"
              title=${source.name}
              @click=${() => this._activateSource(source)}
            >
              ${source.icon ? b2`<ha-icon icon=${source.icon}></ha-icon>` : source.label ?? source.name}
            </button>
          `
    )}
      </div>
    `;
  }
  _activateSource(source) {
    if (source.type === "command" && source.command) {
      this._command(source.command);
      return;
    }
    if (source.type === "channel") {
      this._command("channel", { number: source.value ?? source.name });
      return;
    }
    if (source.type === "source") {
      this._command("source", { source: source.value ?? source.name });
      return;
    }
    this._command("launch", { app: source.value ?? source.name });
  }
  _onPointerDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    this._lastPointer = { x: event.clientX, y: event.clientY, time: Date.now() };
    this._tapStart = this._lastPointer;
  }
  _onPointerMove(event) {
    if (!this._lastPointer) return;
    const dx = event.clientX - this._lastPointer.x;
    const dy = event.clientY - this._lastPointer.y;
    this._lastPointer = { x: event.clientX, y: event.clientY, time: Date.now() };
    this._queueMove(dx, dy);
  }
  _onPointerUp(event) {
    if (this._tapStart) {
      const distance = Math.hypot(event.clientX - this._tapStart.x, event.clientY - this._tapStart.y);
      if (distance < 8 && Date.now() - this._tapStart.time < 280) {
        this._command("click");
        this._haptic();
      }
    }
    this._lastPointer = void 0;
    this._tapStart = void 0;
  }
  _onWheel(event) {
    event.preventDefault();
    this._command("scroll", { dy: Math.round(event.deltaY) }, false);
  }
  _queueMove(dx, dy) {
    const sensitivity = Number(this._config.sensitivity ?? 1);
    this._pendingMove.dx += dx * sensitivity;
    this._pendingMove.dy += dy * sensitivity;
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => {
      this._raf = void 0;
      const payload = { dx: Math.round(this._pendingMove.dx), dy: Math.round(this._pendingMove.dy) };
      this._pendingMove = { dx: 0, dy: 0 };
      if (payload.dx || payload.dy) this._command("move", payload, false);
    });
  }
  async _checkHealth() {
    if (!this._config) return;
    try {
      const response = await this._fetch(`${this._apiBase()}/health`, { cache: "no-store" });
      const data = await response.json();
      this._health = data.connected ? "connected" : data.connecting ? "checking" : "disconnected";
      this._error = data.error && !data.connected ? data.error : "";
    } catch (error) {
      this._health = "disconnected";
      this._setError(error);
    }
  }
  async _command(path, body, notify = true) {
    try {
      const response = await this._fetch(`${this._apiBase()}/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body ?? {})
      });
      const data = await response.json().catch(() => ({ ok: response.ok }));
      if (!response.ok || data.ok === false) {
        throw new Error(data.error || `${path} failed`);
      }
      this._error = "";
      this._health = "connected";
      this._haptic();
      return true;
    } catch (error) {
      this._health = "disconnected";
      this._setError(error, notify);
      return false;
    }
  }
  _apiBase() {
    const entry = this._config.entry_id ? `/${this._config.entry_id}` : "";
    return `/api/lg_webos_magic_touchpad${entry}`;
  }
  _fetch(path, init) {
    if (path.startsWith("/api/") && this.hass?.fetchWithAuth) {
      return this.hass.fetchWithAuth(path, init);
    }
    return fetch(path, init);
  }
  _setError(error, notify = false) {
    this._error = error instanceof Error ? error.message : String(error);
    if (notify) {
      this.dispatchEvent(
        new CustomEvent("hass-notification", {
          detail: { message: `LG remote: ${this._error}` },
          bubbles: true,
          composed: true
        })
      );
    }
  }
  _haptic() {
    if ("vibrate" in navigator) navigator.vibrate(8);
  }
  getCardSize() {
    return 8;
  }
};
LgWebosMagicRemoteCard.properties = {
  hass: { attribute: false },
  _config: { state: true },
  _health: { state: true },
  _error: { state: true }
};
LgWebosMagicRemoteCard.styles = i`
    :host {
      display: block;
      -webkit-tap-highlight-color: transparent;
    }

    ha-card {
      background: var(--ha-card-background, var(--card-background-color, #fff));
      color: var(--primary-text-color);
      border-radius: var(--ha-card-border-radius, 12px);
      padding: 14px;
      overflow: hidden;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }

    .title {
      font-size: 17px;
      font-weight: 600;
      line-height: 1.2;
      overflow-wrap: anywhere;
    }

    .entity {
      color: var(--secondary-text-color);
      font-size: 12px;
      margin-top: 2px;
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--secondary-text-color);
      font-size: 12px;
      white-space: nowrap;
    }

    .dot {
      width: 9px;
      height: 9px;
      border-radius: 999px;
      background: var(--warning-color, #f4b400);
    }

    .connected .dot {
      background: var(--success-color, #43a047);
    }

    .disconnected .dot {
      background: var(--error-color, #db4437);
    }

    .remote-wrap {
      display: grid;
      place-items: center;
    }

    .remote {
      --remote-scale: 1;
      width: min(100%, calc(224px * var(--remote-scale)));
      max-width: 320px;
      border-radius: 34px;
      padding: calc(14px * var(--remote-scale));
      background:
        linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent 18%, transparent 82%, rgba(255, 255, 255, 0.08)),
        linear-gradient(180deg, #232323, #070707 52%, #181818);
      border: 1px solid #3c3c3c;
      box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, 0.15),
        inset 0 -10px 20px rgba(0, 0, 0, 0.42),
        0 18px 40px rgba(0, 0, 0, 0.28);
      box-sizing: border-box;
      color: #f5f5f5;
    }

    .top {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      margin-bottom: 10px;
    }

    .mic {
      justify-self: end;
      color: #b7b7b7;
    }

    .grid {
      display: grid;
      gap: 8px;
    }

    .three {
      grid-template-columns: repeat(3, 1fr);
    }

    .two-side {
      grid-template-columns: 46px 1fr 46px;
      align-items: center;
      margin-top: 12px;
    }

    button {
      position: relative;
      display: inline-grid;
      place-items: center;
      min-width: 0;
      min-height: 0;
      border: 1px solid rgba(255, 255, 255, 0.13);
      color: #f4f4f4;
      background:
        radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.22), transparent 34%),
        linear-gradient(180deg, #3b3b3b, #151515);
      box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, 0.22),
        inset 0 -4px 8px rgba(0, 0, 0, 0.42),
        0 2px 4px rgba(0, 0, 0, 0.35);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      user-select: none;
      box-sizing: border-box;
    }

    button:active {
      transform: translateY(1px);
      filter: brightness(1.18);
    }

    ha-icon {
      width: 20px;
      height: 20px;
      color: currentColor;
    }

    .round {
      aspect-ratio: 1;
      border-radius: 999px;
      font-size: 18px;
    }

    .small {
      width: 34px;
      height: 34px;
      border-radius: 999px;
      font-size: 12px;
    }

    .pill {
      height: 86px;
      border-radius: 18px;
      grid-template-rows: 1fr 1px 1fr;
      overflow: hidden;
      padding: 0;
      font-size: 20px;
    }

    .pill span {
      display: grid;
      place-items: center;
      width: 100%;
      height: 100%;
    }

    .pill .sep {
      height: 1px;
      background: rgba(255, 255, 255, 0.16);
    }

    .power {
      color: #ff4f5f;
      width: 40px;
      height: 40px;
      border-color: rgba(255, 79, 95, 0.35);
    }

    .keypad,
    .touchpanel {
      margin-top: 4px;
      margin-bottom: 12px;
    }

    .touchpanel {
      height: 166px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      background:
        radial-gradient(circle, rgba(255, 255, 255, 0.18) 1px, transparent 1px),
        linear-gradient(180deg, #282828, #171717);
      background-size: 10px 10px, auto;
      touch-action: none;
      display: grid;
      place-items: end center;
      padding: 9px;
      box-sizing: border-box;
      color: #d9d9d9;
      cursor: crosshair;
    }

    .touchdot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      border: 2px solid #d9d9d9;
      opacity: 0.9;
    }

    .guide-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin-top: 8px;
    }

    .center-actions {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 10px;
      align-items: center;
    }

    .wheel {
      position: relative;
      width: 134px;
      height: 134px;
      justify-self: center;
      border-radius: 999px;
      background:
        conic-gradient(from 20deg, #070707, #242424, #080808, #2e2e2e, #070707);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow:
        inset 0 0 16px rgba(255, 255, 255, 0.08),
        inset 0 -18px 26px rgba(0, 0, 0, 0.75);
    }

    .wheel button {
      position: absolute;
      background: transparent;
      border: 0;
      box-shadow: none;
      color: #e8e8e8;
    }

    .wheel .up {
      top: 4px;
      left: 45px;
      width: 44px;
      height: 32px;
    }

    .wheel .down {
      bottom: 4px;
      left: 45px;
      width: 44px;
      height: 32px;
    }

    .wheel .left {
      top: 45px;
      left: 4px;
      width: 32px;
      height: 44px;
    }

    .wheel .right {
      top: 45px;
      right: 4px;
      width: 32px;
      height: 44px;
    }

    .ok {
      top: 43px;
      left: 43px;
      width: 48px;
      height: 48px;
      border-radius: 999px;
      background:
        radial-gradient(circle at 40% 20%, #575757, #1c1c1c 58%, #070707);
      border: 1px solid rgba(255, 255, 255, 0.16);
      box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.16);
    }

    .post-wheel {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 48px;
      margin-top: 8px;
    }

    .color-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-top: 12px;
    }

    .color {
      height: 18px;
      border-radius: 999px;
      color: transparent;
    }

    .red {
      background: linear-gradient(#ff6464, #c92231);
    }

    .green {
      background: linear-gradient(#34e08b, #00a866);
    }

    .yellow {
      background: linear-gradient(#ffe77d, #dcb935);
    }

    .blue {
      background: linear-gradient(#56c6ff, #1686d9);
    }

    .sources {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      margin-top: 10px;
      border-radius: 0 0 20px 20px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .source {
      height: 40px;
      border-radius: 0;
      font-size: 11px;
      letter-spacing: 0;
      background: linear-gradient(180deg, #222, #111);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
      overflow-wrap: anywhere;
      padding: 0 4px;
    }

    .source.netflix {
      color: #ff3131;
      font-weight: 800;
      font-size: 13px;
    }

    .media-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 7px;
      margin-top: 10px;
    }

    .media-row button {
      height: 32px;
      border-radius: 999px;
    }

    .error {
      margin-top: 10px;
      color: var(--error-color, #db4437);
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    @media (max-width: 420px) {
      ha-card {
        padding: 10px;
      }
    }
  `;
if (!customElements.get("lg-webos-magic-remote-card")) {
  customElements.define("lg-webos-magic-remote-card", LgWebosMagicRemoteCard);
}
window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "lg-webos-magic-remote-card")) {
  window.customCards.push({
    type: "lg-webos-magic-remote-card",
    name: "LG webOS Magic Remote Card",
    description: "Full LG Magic Remote control through the Home Assistant integration."
  });
}
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/lit-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-element/lit-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
